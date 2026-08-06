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
        var tournament = await GetTournamentOrThrowAsync(request.TournamentId!.Value);

        string? oldLogoKeyToDelete = null;
        Team team;
        if (request.Id == null)
        {
            team = new Team { TeamName = request.TeamName!, LogoKey = request.LogoKey, TournamentId = tournament.Id, Tournament = tournament };
            db.Teams.Add(team);
        }
        else
        {
            (team, oldLogoKeyToDelete) = await UpdateExistingTeamAsync(request, tournament);
        }

        await db.SaveChangesAsync();

        // Only delete the old logo once the DB update has actually committed — deleting it
        // beforehand would leave a dangling reference if SaveChangesAsync failed.
        if (oldLogoKeyToDelete != null)
        {
            await TryAsync(() => teamLogoStorageProvider.DeleteAsync(oldLogoKeyToDelete), "delete replaced team logo");
        }

        return ConvertToTeamResponse(team, tournament.Name);
    }

    private async Task<(Team Team, string? OldLogoKeyToDelete)> UpdateExistingTeamAsync(TeamRequest request, Tournament tournament)
    {
        var team = await GetTeamOrThrowAsync(request.Id!.Value);
        var previousLogoKey = team.LogoKey;

        team.TeamName = request.TeamName!;
        if (request.LogoKey != null)
        {
            team.LogoKey = request.LogoKey;
        }

        team.TournamentId = tournament.Id;
        team.Tournament = tournament;

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
        await ValidateTournamentDateAsync(team.TournamentId);

        var teamMatches = await db.Matches.Where(m => m.HomeTeamId == teamId || m.AwayTeamId == teamId).ToListAsync();
        if (teamMatches.Count > 0)
        {
            db.Matches.RemoveRange(teamMatches);
        }

        db.Teams.Remove(team);
        await db.SaveChangesAsync();

        // Best-effort cleanup — the team is already gone from the DB; a storage failure here
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
            ?? throw new TournamentServiceException(RestErrorMessageDetail.PlayerIsNotPartOfThisTeam, HttpStatusCode.NotFound);

        var previousPosition = teamPlayer.PlayingPosition;
        var newPosition = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        if (previousPosition == FootballPosition.GOALKEEPER && newPosition != FootballPosition.GOALKEEPER)
        {
            await RemoveGoalKeeperRoundAsync(player.Id, team.TournamentId);
        }
        else if (previousPosition != FootballPosition.GOALKEEPER && newPosition == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.TournamentId);
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
        await ValidateTournamentDateAsync(team.TournamentId);
        var player = await GetPlayerOrThrowAsync(request.PlayerId!.Value);
        await RemoveGoalKeeperRoundAsync(player.Id, team.TournamentId);

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.TeamId == request.TeamId && tp.PlayerId == request.PlayerId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.PlayerIsNotPartOfThisTeam, HttpStatusCode.NotFound);

        db.TeamPlayers.Remove(teamPlayer);
        await db.SaveChangesAsync();
    }

    public async Task<List<TournamentWithTeamsResponse>> GetTournamentsSummaryAsync(long? tournamentId)
    {
        if (tournamentId != null)
        {
            return [await GetTournamentWithTeamsAndPlayersAsync(tournamentId.Value)];
        }

        var tournaments = await db.Tournaments.Include(t => t.Venue).ToListAsync();
        var result = new List<TournamentWithTeamsResponse>();
        foreach (var tournament in tournaments)
        {
            result.Add(await BuildTournamentWithTeamsResponseAsync(tournament));
        }

        return result;
    }

    private async Task<TournamentWithTeamsResponse> GetTournamentWithTeamsAndPlayersAsync(long tournamentId)
    {
        var tournament = await db.Tournaments.Include(t => t.Venue).FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);
        return await BuildTournamentWithTeamsResponseAsync(tournament);
    }

    private async Task<TournamentWithTeamsResponse> BuildTournamentWithTeamsResponseAsync(Tournament tournament)
    {
        var teams = await db.Teams
            .Include(t => t.TeamPlayers).ThenInclude(tp => tp.Player)
            .Where(t => t.TournamentId == tournament.Id)
            .ToListAsync();

        return new TournamentWithTeamsResponse
        {
            Id = tournament.Id,
            Name = tournament.Name,
            Title = tournament.Title,
            Season = tournament.Season,
            Description = tournament.Description,
            Rules = tournament.Rules,
            TournamentDate = tournament.TournamentDate,
            VenueName = tournament.Venue.Name,
            VenueMapLink = tournament.Venue.MapLink,
            ActiveStatus = tournament.IsActive,
            IsWeeklyMatchDay = tournament.IsWeeklyMatchDay,
            Teams = teams.Select(ConvertToTournamentTeamResponse).ToList(),
        };
    }

    private TournamentTeamResponse ConvertToTournamentTeamResponse(Team team) => new()
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

    private async Task<bool> IsPlayerAssignedToAnyTeamInTournamentAsync(long tournamentId, long playerId)
    {
        var teamIds = await db.Teams.Where(t => t.TournamentId == tournamentId).Select(t => t.Id).ToListAsync();
        return await db.TeamPlayers.AnyAsync(tp => teamIds.Contains(tp.TeamId) && tp.PlayerId == playerId);
    }

    private async Task<Tournament> GetTournamentOrThrowAsync(long tournamentId) =>
        await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);

    private async Task<Team> GetTeamOrThrowAsync(long teamId) =>
        await db.Teams.FirstOrDefaultAsync(t => t.Id == teamId)
            ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

    private async Task<Player> GetPlayerOrThrowAsync(long playerId) =>
        await db.Players.FirstOrDefaultAsync(p => p.Id == playerId)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

    private async Task ValidateTournamentDateAsync(long tournamentId)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);
        if (tournament.TournamentDate < DateTime.Now)
        {
            throw new TournamentServiceException(RestErrorMessageDetail.TournamentDateCannotBePastDate, HttpStatusCode.BadRequest);
        }
    }

    private async Task<TeamPlayer> CreateTeamPlayerAsync(TeamPlayerRequest request, Team team, Player player)
    {
        await ValidateTournamentDateAsync(team.TournamentId);

        var isParticipant = await db.TournamentParticipants.AnyAsync(
            tp => tp.TournamentId == team.TournamentId && tp.PlayerId == player.Id && tp.ParticipationStatus);
        if (!isParticipant)
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotParticipantYet, HttpStatusCode.BadRequest);
        }

        if (await IsPlayerAssignedToAnyTeamInTournamentAsync(team.TournamentId, player.Id))
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
            await TrackGoalKeeperRoundAsync(player.Id, team.TournamentId);
        }

        return teamPlayer;
    }

    private async Task<TeamPlayer> UpdateTeamPlayerAsync(TeamPlayerRequest request, Team team, Player player)
    {
        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.Id == request.Id)
            ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

        var previousPosition = teamPlayer.PlayingPosition;
        var newPosition = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        if (previousPosition == FootballPosition.GOALKEEPER && newPosition != FootballPosition.GOALKEEPER)
        {
            await RemoveGoalKeeperRoundAsync(player.Id, team.TournamentId);
        }
        else if (previousPosition != FootballPosition.GOALKEEPER && newPosition == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.TournamentId);
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

    private TeamResponse ConvertToTeamResponse(Team team, string tournamentName) => new()
    {
        TeamId = team.Id,
        TeamName = team.TeamName,
        LogoKey = team.LogoKey,
        LogoUrl = BuildTeamLogoUrl(team.LogoKey),
        TournamentId = team.TournamentId,
        TournamentName = tournamentName,
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

    private async Task TrackGoalKeeperRoundAsync(long playerId, long tournamentId)
    {
        var lastRoundInPreviousTournaments = await db.PlayerGoalkeepingHistories
            .Where(h => h.PlayerId == playerId)
            .Select(h => (int?)h.RoundNumber)
            .MaxAsync() ?? 0;

        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);

        db.PlayerGoalkeepingHistories.Add(new PlayerGoalkeepingHistory
        {
            PlayerId = playerId,
            TournamentId = tournamentId,
            RoundNumber = lastRoundInPreviousTournaments + 1,
            PlayedDate = tournament.TournamentDate,
        });
    }

    private async Task RemoveGoalKeeperRoundAsync(long playerId, long tournamentId)
    {
        var histories = await db.PlayerGoalkeepingHistories
            .Where(h => h.PlayerId == playerId && h.TournamentId == tournamentId)
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
