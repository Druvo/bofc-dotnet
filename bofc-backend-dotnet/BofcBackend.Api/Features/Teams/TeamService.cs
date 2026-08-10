using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Storage;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Teams.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Teams;

/// <summary>Port of service/TeamManagementServiceImpl.java.</summary>
public class TeamService(
    BofcDbContext db,
    [FromKeyedServices("team-logo")] IMediaStorageProvider teamLogoStorageProvider,
    ILogger<TeamService> logger)
    : ITeamService
{
    public async Task<TeamResponse> CreateOrUpdateTeamAsync(TeamRequest request)
    {
        var matchDay = await GetMatchDayOrThrowAsync(request.MatchDayId!.Value);
        await ValidateMatchDayDateAsync(matchDay.Id);

        string? oldLogoKeyToDelete = null;
        Team team;
        if (request.Id == null)
        {
            team = new Team { TeamName = request.TeamName!, LogoKey = request.LogoKey, MatchDayId = matchDay.Id, MatchDay = matchDay };
            db.Teams.Add(team);
        }
        else
        {
            (team, oldLogoKeyToDelete) = await UpdateExistingTeamAsync(request, matchDay);
        }

        await db.SaveChangesAsync();

        // Only delete the old logo once the DB update has actually committed - deleting it
        // beforehand would leave a dangling reference if SaveChangesAsync failed.
        if (oldLogoKeyToDelete != null)
        {
            await TryAsync(() => teamLogoStorageProvider.DeleteAsync(oldLogoKeyToDelete), "delete replaced team logo");
        }

        return ConvertToTeamResponse(team, matchDay.Name);
    }

    private async Task<(Team Team, string? OldLogoKeyToDelete)> UpdateExistingTeamAsync(TeamRequest request, MatchDay matchDay)
    {
        var team = await GetTeamOrThrowAsync(request.Id!.Value);
        var previousLogoKey = team.LogoKey;

        team.TeamName = request.TeamName!;
        if (request.LogoKey != null)
        {
            team.LogoKey = request.LogoKey;
        }

        team.MatchDayId = matchDay.Id;
        team.MatchDay = matchDay;

        var currentLogoKey = team.LogoKey;
        var oldLogoKeyToDelete = !string.IsNullOrWhiteSpace(previousLogoKey)
            && !string.IsNullOrWhiteSpace(currentLogoKey)
            && currentLogoKey != previousLogoKey
                ? previousLogoKey
                : null;

        return (team, oldLogoKeyToDelete);
    }

    public async Task DeleteTeamAsync(long teamId)
    {
        var team = await GetTeamOrThrowAsync(teamId);
        await ValidateMatchDayDateAsync(team.MatchDayId);

        var teamMatches = await db.Matches.Where(m => m.HomeTeamId == teamId || m.AwayTeamId == teamId).ToListAsync();
        if (teamMatches.Count > 0)
        {
            db.Matches.RemoveRange(teamMatches);
        }

        db.Teams.Remove(team);

        // If this was the last team on the MatchDay, clear the auto-team-generation flag too -
        // otherwise it stays stuck true forever with zero actual teams, permanently blocking the
        // "Generate Teams Now" test action (and the hourly scheduler) from ever regenerating.
        var isLastTeam = await db.Teams.CountAsync(t => t.MatchDayId == team.MatchDayId) == 1;
        if (isLastTeam)
        {
            var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == team.MatchDayId);
            if (matchDay != null)
            {
                matchDay.AutoTeamsGenerated = false;
            }
        }

        await db.SaveChangesAsync();

        // Best-effort cleanup - the team is already gone from the DB; a storage failure here
        // must not make this operation look like it failed.
        if (!string.IsNullOrWhiteSpace(team.LogoKey))
        {
            await TryAsync(() => teamLogoStorageProvider.DeleteAsync(team.LogoKey), "delete team logo");
        }
    }

    private async Task TryAsync(Func<Task> action, string description)
    {
        try
        {
            await action();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to {Description}", description);
        }
    }

    public async Task<TeamPlayerResponse> SaveOrUpdateTeamPlayerAsync(TeamPlayerRequest request)
    {
        var team = await GetTeamOrThrowAsync(request.TeamId!.Value);
        var player = await GetPlayerOrThrowAsync(request.PlayerId!.Value);

        var teamPlayer = request.Id == null
            ? await CreateTeamPlayerAsync(request, team, player)
            : await UpdateTeamPlayerAsync(request, team, player);

        if (request.Id == null)
        {
            db.TeamPlayers.Add(teamPlayer);
        }

        await db.SaveChangesAsync();
        return ConvertToTeamPlayerResponse(teamPlayer, team, player);
    }

    public async Task<TeamPlayerResponse> UpdateTeamPlayerDetailsAsync(TeamPlayerRequest request)
    {
        var team = await GetTeamOrThrowAsync(request.TeamId!.Value);
        var player = await GetPlayerOrThrowAsync(request.PlayerId!.Value);

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.TeamId == request.TeamId && tp.PlayerId == request.PlayerId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.PlayerIsNotPartOfThisTeam, HttpStatusCode.NotFound);

        var previousPosition = teamPlayer.PlayingPosition;
        var newPosition = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        if (previousPosition == FootballPosition.GOALKEEPER && newPosition != FootballPosition.GOALKEEPER)
        {
            await RemoveGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }
        else if (previousPosition != FootballPosition.GOALKEEPER && newPosition == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }

        if (request.IsCaptain == true)
        {
            await RemoveCaptainStatusFromOtherPlayersAsync(request.TeamId!.Value, request.PlayerId!.Value);
        }

        teamPlayer.PlayingPosition = newPosition;

        var newIsCaptain = request.IsCaptain ?? teamPlayer.IsCaptain;
        teamPlayer.IsCaptain = newIsCaptain;
        teamPlayer.TeamPlayerRole = newIsCaptain ? Domain.Enums.TeamPlayerRole.CAPTAIN : Domain.Enums.TeamPlayerRole.PLAYER;
        teamPlayer.JerseyNumber = request.JerseyNumber ?? teamPlayer.JerseyNumber;

        await db.SaveChangesAsync();
        return ConvertToTeamPlayerResponse(teamPlayer, team, player);
    }

    public async Task RemovePlayerFromTeamAsync(TeamPlayerRemoveRequest request)
    {
        var team = await GetTeamOrThrowAsync(request.TeamId!.Value);
        await ValidateMatchDayDateAsync(team.MatchDayId);
        var player = await GetPlayerOrThrowAsync(request.PlayerId!.Value);
        await RemoveGoalKeeperRoundAsync(player.Id, team.MatchDayId);

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.TeamId == request.TeamId && tp.PlayerId == request.PlayerId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.PlayerIsNotPartOfThisTeam, HttpStatusCode.NotFound);

        db.TeamPlayers.Remove(teamPlayer);
        await db.SaveChangesAsync();
    }

    public async Task<List<MatchDayWithTeamsResponse>> GetMatchDaysSummaryAsync(long? matchDayId)
    {
        if (matchDayId != null)
        {
            return [await GetMatchDayWithTeamsAndPlayersAsync(matchDayId.Value)];
        }

        var matchDays = await db.MatchDays.Include(t => t.Venue).ToListAsync();
        var result = new List<MatchDayWithTeamsResponse>();
        foreach (var matchDay in matchDays)
        {
            result.Add(await BuildMatchDayWithTeamsResponseAsync(matchDay));
        }

        return result;
    }

    private async Task<MatchDayWithTeamsResponse> GetMatchDayWithTeamsAndPlayersAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.Include(t => t.Venue).FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        return await BuildMatchDayWithTeamsResponseAsync(matchDay);
    }

    private async Task<MatchDayWithTeamsResponse> BuildMatchDayWithTeamsResponseAsync(MatchDay matchDay)
    {
        var teams = await db.Teams
            .Include(t => t.TeamPlayers).ThenInclude(tp => tp.Player)
            .Where(t => t.MatchDayId == matchDay.Id)
            .ToListAsync();

        return new MatchDayWithTeamsResponse
        {
            Id = matchDay.Id,
            Name = matchDay.Name,
            Title = matchDay.Title,
            Season = matchDay.Season,
            Description = matchDay.Description,
            Rules = matchDay.Rules,
            MatchDayDate = matchDay.MatchDayDate,
            DurationMinutes = matchDay.DurationMinutes,
            VenueName = matchDay.Venue.Name,
            VenueMapLink = matchDay.Venue.MapLink,
            ActiveStatus = matchDay.IsActive,
            IsWeeklyMatchDay = matchDay.IsWeeklyMatchDay,
            Teams = teams.Select(ConvertToMatchDayTeamResponse).ToList(),
        };
    }

    private MatchDayTeamResponse ConvertToMatchDayTeamResponse(Team team) => new()
    {
        TeamId = team.Id,
        TeamName = team.TeamName,
        LogoKey = team.LogoKey,
        LogoUrl = BuildTeamLogoUrl(team.LogoKey),
        Players = team.TeamPlayers.Select(tp => new TeamPlayerResponse
        {
            Id = tp.Id,
            TeamId = team.Id,
            PlayerId = tp.Player.Id,
            TeamName = team.TeamName,
            PlayerName = tp.Player.Name,
            PlayingPosition = tp.PlayingPosition,
            TeamPlayerRole = tp.TeamPlayerRole.ToString(),
            IsCaptain = tp.IsCaptain,
            JerseyNumber = tp.JerseyNumber,
            PhotoKey = tp.Player.PhotoKey,
            PhotoUrl = BuildPlayerPhotoUrl(tp.Player.PhotoKey),
        }).ToList(),
    };

    private async Task<bool> IsPlayerAssignedToAnyTeamInMatchDayAsync(long matchDayId, long playerId)
    {
        var teamIds = await db.Teams.Where(t => t.MatchDayId == matchDayId).Select(t => t.Id).ToListAsync();
        return await db.TeamPlayers.AnyAsync(tp => teamIds.Contains(tp.TeamId) && tp.PlayerId == playerId);
    }

    private async Task<MatchDay> GetMatchDayOrThrowAsync(long matchDayId) =>
        await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

    private async Task<Team> GetTeamOrThrowAsync(long teamId) =>
        await db.Teams.FirstOrDefaultAsync(t => t.Id == teamId)
            ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

    private async Task<Player> GetPlayerOrThrowAsync(long playerId) =>
        await db.Players.FirstOrDefaultAsync(p => p.Id == playerId)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

    private async Task ValidateMatchDayDateAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        if (matchDay.MatchDayDate < DateTime.Now)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayDateCannotBePastDate, HttpStatusCode.BadRequest);
        }
    }

    private async Task<TeamPlayer> CreateTeamPlayerAsync(TeamPlayerRequest request, Team team, Player player)
    {
        await ValidateMatchDayDateAsync(team.MatchDayId);

        var isParticipant = await db.MatchDayParticipants.AnyAsync(
            tp => tp.MatchDayId == team.MatchDayId && tp.PlayerId == player.Id && tp.ParticipationStatus);
        if (!isParticipant)
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotParticipantYet, HttpStatusCode.BadRequest);
        }

        if (await IsPlayerAssignedToAnyTeamInMatchDayAsync(team.MatchDayId, player.Id))
        {
            throw new TeamServiceException(RestErrorMessageDetail.PlayerAlreadyAddedAnotherTeam, HttpStatusCode.Conflict);
        }

        if (request.IsCaptain == true)
        {
            await RemoveCaptainStatusFromOtherPlayersAsync(request.TeamId!.Value, player.Id);
        }

        var isCaptain = request.IsCaptain ?? false;
        var position = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        var teamPlayer = new TeamPlayer
        {
            TeamId = team.Id,
            Team = team,
            PlayerId = player.Id,
            Player = player,
            PlayingPosition = position,
            IsCaptain = isCaptain,
            TeamPlayerRole = isCaptain ? Domain.Enums.TeamPlayerRole.CAPTAIN : Domain.Enums.TeamPlayerRole.PLAYER,
            JerseyNumber = request.JerseyNumber,
        };

        if (position == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }

        return teamPlayer;
    }

    private async Task<TeamPlayer> UpdateTeamPlayerAsync(TeamPlayerRequest request, Team team, Player player)
    {
        await ValidateMatchDayDateAsync(team.MatchDayId);

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.Id == request.Id)
            ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

        var previousPosition = teamPlayer.PlayingPosition;
        var newPosition = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        if (previousPosition == FootballPosition.GOALKEEPER && newPosition != FootballPosition.GOALKEEPER)
        {
            await RemoveGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }
        else if (previousPosition != FootballPosition.GOALKEEPER && newPosition == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }

        if (request.IsCaptain == true)
        {
            await RemoveCaptainStatusFromOtherPlayersAsync(request.TeamId!.Value, player.Id);
        }

        teamPlayer.TeamId = team.Id;
        teamPlayer.Team = team;
        teamPlayer.PlayerId = player.Id;
        teamPlayer.Player = player;
        teamPlayer.PlayingPosition = newPosition;

        var newIsCaptain = request.IsCaptain ?? teamPlayer.IsCaptain;
        teamPlayer.IsCaptain = newIsCaptain;
        teamPlayer.TeamPlayerRole = newIsCaptain ? Domain.Enums.TeamPlayerRole.CAPTAIN : Domain.Enums.TeamPlayerRole.PLAYER;
        teamPlayer.JerseyNumber = request.JerseyNumber ?? teamPlayer.JerseyNumber;

        return teamPlayer;
    }

    private TeamResponse ConvertToTeamResponse(Team team, string matchDayName) => new()
    {
        TeamId = team.Id,
        TeamName = team.TeamName,
        LogoKey = team.LogoKey,
        LogoUrl = BuildTeamLogoUrl(team.LogoKey),
        MatchDayId = team.MatchDayId,
        MatchDayName = matchDayName,
    };

    private static string? BuildTeamLogoUrl(string? logoKey) =>
        string.IsNullOrWhiteSpace(logoKey) ? null : $"/files/team-logos/{logoKey}";

    private TeamPlayerResponse ConvertToTeamPlayerResponse(TeamPlayer teamPlayer, Team team, Player player) => new()
    {
        Id = teamPlayer.Id,
        TeamId = team.Id,
        TeamName = team.TeamName,
        PlayerId = player.Id,
        PlayerName = player.Name,
        PlayingPosition = teamPlayer.PlayingPosition,
        TeamPlayerRole = teamPlayer.TeamPlayerRole.ToString(),
        IsCaptain = teamPlayer.IsCaptain,
        JerseyNumber = teamPlayer.JerseyNumber,
        PhotoKey = player.PhotoKey,
        PhotoUrl = BuildPlayerPhotoUrl(player.PhotoKey),
    };

    private static string? BuildPlayerPhotoUrl(string? photoKey) =>
        string.IsNullOrWhiteSpace(photoKey) ? null : $"/files/player-photos/{photoKey}";

    private async Task TrackGoalKeeperRoundAsync(long playerId, long matchDayId)
    {
        var lastRoundInPreviousMatchDays = await db.PlayerGoalkeepingHistories
            .Where(h => h.PlayerId == playerId)
            .Select(h => (int?)h.RoundNumber)
            .MaxAsync() ?? 0;

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        db.PlayerGoalkeepingHistories.Add(new PlayerGoalkeepingHistory
        {
            PlayerId = playerId,
            MatchDayId = matchDayId,
            RoundNumber = lastRoundInPreviousMatchDays + 1,
            PlayedDate = matchDay.MatchDayDate,
        });
    }

    private async Task RemoveGoalKeeperRoundAsync(long playerId, long matchDayId)
    {
        var histories = await db.PlayerGoalkeepingHistories
            .Where(h => h.PlayerId == playerId && h.MatchDayId == matchDayId)
            .ToListAsync();
        db.PlayerGoalkeepingHistories.RemoveRange(histories);
    }

    private async Task RemoveCaptainStatusFromOtherPlayersAsync(long teamId, long currentPlayerId)
    {
        var teamPlayers = await db.TeamPlayers
            .Where(tp => tp.TeamId == teamId && tp.PlayerId != currentPlayerId && tp.IsCaptain)
            .ToListAsync();

        foreach (var tp in teamPlayers)
        {
            tp.IsCaptain = false;
        }
    }
}
