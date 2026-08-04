using System.Net;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.RealTime;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Matches.Models;
using BofcBackend.Api.Features.Rounds;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Matches;

/// <summary>Port of service/MatchManagementServiceImpl.java.</summary>
public class MatchManagementService(
    BofcDbContext db,
    ICurrentUserService currentUser,
    IRoundGroupService roundGroupService,
    ITournamentRoundService tournamentRoundService,
    IMatchStatisticsService matchStatisticsService,
    ILiveMatchUpdatePublisher liveMatchUpdatePublisher,
    ILogger<MatchManagementService> logger) : IMatchManagementService
{
    public async Task<MatchResponse> GetMatchByIdAsync(long matchId) => ToResponse(await GetMatchEntityAsync(matchId));

    public async Task<MatchResponse> StartMatchAsync(long matchId)
    {
        var match = await GetMatchEntityAsync(matchId);

        if (match.MatchStatus != MatchStatus.SCHEDULED)
        {
            throw new TournamentServiceException("Only scheduled matches can be started", HttpStatusCode.Conflict);
        }

        if (match.RoundId is { } roundId)
        {
            var round = await db.TournamentRounds.FirstOrDefaultAsync(r => r.Id == roundId);
            if (round is { Status: RoundStatus.NOT_STARTED })
            {
                throw new TournamentServiceException(
                    $"Cannot start match. The round '{round.RoundName}' must be started first before individual matches can be started. Please start the round from the tournament management panel.",
                    HttpStatusCode.Conflict);
            }
        }

        match.MatchStatus = MatchStatus.ONGOING;
        match.StartedAt = DateTime.UtcNow;
        match.ElapsedTimeSeconds = 0;

        var adminPlayer = await db.Players.FirstOrDefaultAsync(p => p.Id == currentUser.GetPlayerId())
            ?? throw new TournamentServiceException("Admin player not found", HttpStatusCode.NotFound);

        db.MatchEvents.Add(new MatchEvent
        {
            MatchId = match.Id,
            EventType = MatchEventType.MATCH_STARTED,
            PlayerId = adminPlayer.Id,
            TeamId = match.HomeTeamId, // placeholder — DB requires team_id even for system events
            EventTime = 0,
            Description = $"Match started by {adminPlayer.Name}",
        });

        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_STARTED");
        return ToResponse(match);
    }

    public async Task<MatchResponse> PauseMatchAsync(long matchId)
    {
        var match = await GetMatchEntityAsync(matchId);
        if (match.MatchStatus != MatchStatus.ONGOING)
        {
            throw new TournamentServiceException("Only ongoing matches can be paused", HttpStatusCode.Conflict);
        }
        match.MatchStatus = MatchStatus.PAUSED;
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_PAUSED");
        return ToResponse(match);
    }

    public async Task<MatchResponse> ResumeMatchAsync(long matchId)
    {
        var match = await GetMatchEntityAsync(matchId);
        if (match.MatchStatus != MatchStatus.PAUSED)
        {
            throw new TournamentServiceException("Only paused matches can be resumed", HttpStatusCode.Conflict);
        }
        match.MatchStatus = MatchStatus.ONGOING;
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_RESUMED");
        return ToResponse(match);
    }

    public async Task<MatchResponse> CompleteMatchAsync(long matchId)
    {
        var match = await GetMatchEntityAsync(matchId);
        if (match.MatchStatus != MatchStatus.ONGOING)
        {
            throw new TournamentServiceException("Only ongoing matches can be completed", HttpStatusCode.Conflict);
        }

        match.MatchStatus = MatchStatus.COMPLETED;
        match.CompletedAt = DateTime.UtcNow;

        var adminPlayer = await db.Players.FirstOrDefaultAsync(p => p.Id == currentUser.GetPlayerId())
            ?? throw new TournamentServiceException("Admin player not found", HttpStatusCode.NotFound);

        db.MatchEvents.Add(new MatchEvent
        {
            MatchId = match.Id,
            EventType = MatchEventType.MATCH_COMPLETED,
            PlayerId = adminPlayer.Id,
            TeamId = match.HomeTeamId,
            EventTime = match.ElapsedTimeSeconds,
            Description = $"Match completed by {adminPlayer.Name}",
        });

        await db.SaveChangesAsync();

        await TryAsync(() => matchStatisticsService.AggregateMatchStatisticsAsync(match.Id), "aggregate match statistics");
        if (match.GroupId is { } groupId)
        {
            await TryAsync(() => roundGroupService.RecalculateGroupStandingsAsync(groupId), "auto-update group standings");
        }
        if (match.RoundId is { } roundId)
        {
            await TryAsync(() => tournamentRoundService.CheckAndAutoCompleteRoundAsync(roundId), "auto-complete round");
        }

        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_COMPLETED");
        return ToResponse(match);
    }

    public async Task<MatchResponse> UpdateMatchAsync(long matchId, MatchUpdateRequest request)
    {
        var match = await GetMatchEntityAsync(matchId);

        var newStatus = Enum.Parse<MatchStatus>(request.MatchStatus);
        match.MatchStatus = newStatus;

        if (newStatus == MatchStatus.COMPLETED && match.CompletedAt == null)
        {
            match.CompletedAt = DateTime.UtcNow;
            if (match.GroupId is { } groupId)
            {
                await TryAsync(() => roundGroupService.RecalculateGroupStandingsAsync(groupId), "auto-update group standings");
            }
            if (match.RoundId is { } roundId)
            {
                await TryAsync(() => tournamentRoundService.CheckAndAutoCompleteRoundAsync(roundId), "auto-complete round");
            }
        }

        if (request.HomeTeamScore != null)
        {
            match.HomeTeamScore = request.HomeTeamScore.Value;
        }
        if (request.AwayTeamScore != null)
        {
            match.AwayTeamScore = request.AwayTeamScore.Value;
        }
        if (request.ElapsedTimeSeconds != null)
        {
            match.ElapsedTimeSeconds = request.ElapsedTimeSeconds.Value;
        }

        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_UPDATED");
        return ToResponse(match);
    }

    public async Task<MatchEventResponse> RecordMatchEventAsync(MatchEventRequest request)
    {
        var match = await GetMatchEntityAsync(request.MatchId!.Value);
        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == request.PlayerId)
            ?? throw new TournamentServiceException("Player not found", HttpStatusCode.NotFound);
        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId)
            ?? throw new TournamentServiceException("Team not found", HttpStatusCode.NotFound);

        Player? relatedPlayer = null;
        if (request.RelatedPlayerId != null)
        {
            relatedPlayer = await db.Players.FirstOrDefaultAsync(p => p.Id == request.RelatedPlayerId)
                ?? throw new TournamentServiceException("Related player not found", HttpStatusCode.NotFound);
        }

        await ValidateMatchEventAsync(match, request, player, team, relatedPlayer);

        var matchEvent = new MatchEvent
        {
            MatchId = match.Id,
            EventType = request.EventType!.Value,
            PlayerId = player.Id,
            TeamId = team.Id,
            EventTime = request.EventTime!.Value,
            Description = request.Description,
            RelatedPlayerId = relatedPlayer?.Id,
            Details = request.Details,
        };
        db.MatchEvents.Add(matchEvent);
        await db.SaveChangesAsync();

        // Auto-convert second yellow card into a red card event for the same player.
        if (request.EventType == MatchEventType.YELLOW_CARD)
        {
            var yellowCount = await CountPlayerEventsAsync(match.Id, player.Id, MatchEventType.YELLOW_CARD);
            var redCount = await CountPlayerEventsAsync(match.Id, player.Id, MatchEventType.RED_CARD);
            if (yellowCount == 2 && redCount == 0)
            {
                db.MatchEvents.Add(new MatchEvent
                {
                    MatchId = match.Id,
                    EventType = MatchEventType.RED_CARD,
                    PlayerId = player.Id,
                    TeamId = team.Id,
                    EventTime = request.EventTime.Value,
                    Description = "Automatic red card (second yellow)",
                    Details = "AUTO_SECOND_YELLOW",
                });
                await db.SaveChangesAsync();
            }
        }

        // Auto-update match score if it's a GOAL event.
        if (request.EventType == MatchEventType.GOAL)
        {
            if (match.HomeTeamId == request.TeamId)
            {
                match.HomeTeamScore += 1;
            }
            else if (match.AwayTeamId == request.TeamId)
            {
                match.AwayTeamScore += 1;
            }
            await db.SaveChangesAsync();
        }

        await TryAsync(() => matchStatisticsService.AggregateMatchStatisticsAsync(match.Id), "aggregate match statistics");

        if (match.MatchStatus == MatchStatus.COMPLETED && match.GroupId is { } groupId)
        {
            await TryAsync(() => roundGroupService.RecalculateGroupStandingsAsync(groupId), "recalculate group standings after event add");
        }

        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_EVENT_RECORDED");
        return ToResponse(matchEvent, player, team, relatedPlayer);
    }

    public async Task<MatchEventResponse> UpdateMatchEventAsync(long eventId, MatchEventUpdateRequest request)
    {
        var matchEvent = await db.MatchEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new TournamentServiceException("Match event not found", HttpStatusCode.NotFound);
        var match = await GetMatchEntityAsync(matchEvent.MatchId);

        if (match.MatchStatus == MatchStatus.COMPLETED && !currentUser.IsInRole(Domain.Constants.PlayerRoleNames.SuperAdmin))
        {
            throw new TournamentServiceException("Only SUPERADMIN can edit events from completed matches", HttpStatusCode.Conflict);
        }

        matchEvent.EventTime = request.EventTime!.Value;
        matchEvent.Description = request.Description;
        matchEvent.Details = request.Details;
        await db.SaveChangesAsync();

        // Recalculate score from goal events to keep consistency after edits.
        match.HomeTeamScore = await db.MatchEvents.CountAsync(e =>
            e.MatchId == match.Id && e.TeamId == match.HomeTeamId && e.EventType == MatchEventType.GOAL);
        match.AwayTeamScore = await db.MatchEvents.CountAsync(e =>
            e.MatchId == match.Id && e.TeamId == match.AwayTeamId && e.EventType == MatchEventType.GOAL);
        await db.SaveChangesAsync();

        await TryAsync(() => matchStatisticsService.AggregateMatchStatisticsAsync(match.Id), "aggregate match statistics after event update");

        if (match.MatchStatus == MatchStatus.COMPLETED && match.GroupId is { } groupId)
        {
            await TryAsync(() => roundGroupService.RecalculateGroupStandingsAsync(groupId), "recalculate group standings after event update");
        }

        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_EVENT_UPDATED");
        return await ToResponseAsync(matchEvent);
    }

    public async Task<List<MatchEventResponse>> GetMatchEventsAsync(long matchId)
    {
        var events = await db.MatchEvents.Where(e => e.MatchId == matchId).OrderBy(e => e.EventTime).ToListAsync();
        var responses = new List<MatchEventResponse>(events.Count);
        foreach (var e in events)
        {
            responses.Add(await ToResponseAsync(e));
        }
        return responses;
    }

    public async Task UpdateElapsedTimeAsync(long matchId, int elapsedSeconds)
    {
        var match = await GetMatchEntityAsync(matchId);
        match.ElapsedTimeSeconds = elapsedSeconds;
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "ELAPSED_TIME_UPDATED");
    }

    public async Task UpdateTeamScoreAsync(long matchId, long teamId, int newScore)
    {
        var match = await GetMatchEntityAsync(matchId);
        var recordedGoals = await db.MatchEvents.CountAsync(e =>
            e.MatchId == matchId && e.TeamId == teamId && e.EventType == MatchEventType.GOAL);

        if (newScore != recordedGoals)
        {
            throw new TournamentServiceException(
                $"Score must match the recorded goal events for this team ({recordedGoals}). Record or delete goal events first.",
                HttpStatusCode.Conflict);
        }

        if (match.HomeTeamId == teamId)
        {
            match.HomeTeamScore = newScore;
        }
        else if (match.AwayTeamId == teamId)
        {
            match.AwayTeamScore = newScore;
        }
        else
        {
            throw new TournamentServiceException("Team is not part of this match", HttpStatusCode.BadRequest);
        }

        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "SCORE_UPDATED");
    }

    public async Task DeleteMatchEventAsync(long eventId)
    {
        var matchEvent = await db.MatchEvents.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new TournamentServiceException("Match event not found", HttpStatusCode.NotFound);
        var match = await GetMatchEntityAsync(matchEvent.MatchId);

        if (match.MatchStatus == MatchStatus.COMPLETED && !currentUser.IsInRole(Domain.Constants.PlayerRoleNames.SuperAdmin))
        {
            throw new TournamentServiceException("Only SUPERADMIN can delete events from completed matches", HttpStatusCode.Conflict);
        }

        if (matchEvent.EventType == MatchEventType.GOAL)
        {
            if (matchEvent.TeamId == match.HomeTeamId && match.HomeTeamScore > 0)
            {
                match.HomeTeamScore -= 1;
            }
            else if (matchEvent.TeamId == match.AwayTeamId && match.AwayTeamScore > 0)
            {
                match.AwayTeamScore -= 1;
            }
        }

        db.MatchEvents.Remove(matchEvent);
        await db.SaveChangesAsync();

        await TryAsync(() => matchStatisticsService.AggregateMatchStatisticsAsync(match.Id), "aggregate match statistics after deletion");

        if (match.MatchStatus == MatchStatus.COMPLETED && match.GroupId is { } groupId)
        {
            await TryAsync(() => roundGroupService.RecalculateGroupStandingsAsync(groupId), "recalculate group standings after event delete");
        }

        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_EVENT_DELETED");
    }

    public async Task<MatchResponse> CreateMatchAsync(MatchCreateRequest request)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == request.TournamentId)
            ?? throw new TournamentServiceException("Tournament not found", HttpStatusCode.NotFound);
        var homeTeam = await db.Teams.FirstOrDefaultAsync(t => t.Id == request.HomeTeamId)
            ?? throw new TournamentServiceException("Home team not found", HttpStatusCode.NotFound);
        var awayTeam = await db.Teams.FirstOrDefaultAsync(t => t.Id == request.AwayTeamId)
            ?? throw new TournamentServiceException("Away team not found", HttpStatusCode.NotFound);

        if (homeTeam.Id == awayTeam.Id)
        {
            throw new TournamentServiceException("Home team and away team cannot be the same", HttpStatusCode.BadRequest);
        }

        TournamentRound? round = null;
        if (request.RoundId != null)
        {
            round = await db.TournamentRounds.FirstOrDefaultAsync(r => r.Id == request.RoundId)
                ?? throw new TournamentServiceException("Round not found", HttpStatusCode.NotFound);
            if (round.TournamentId != request.TournamentId)
            {
                throw new TournamentServiceException("Round does not belong to this tournament", HttpStatusCode.BadRequest);
            }
        }

        RoundGroup? group = null;
        if (request.GroupId != null)
        {
            group = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == request.GroupId)
                ?? throw new TournamentServiceException("Group not found", HttpStatusCode.NotFound);
            if (round != null && group.RoundId != round.Id)
            {
                throw new TournamentServiceException("Group does not belong to the specified round", HttpStatusCode.BadRequest);
            }
        }

        if (request.VenueId != null && !await db.Venues.AnyAsync(v => v.Id == request.VenueId))
        {
            throw new TournamentServiceException("Venue not found", HttpStatusCode.NotFound);
        }

        var matchOrder = request.MatchOrder ?? (await db.Matches
            .Where(m => m.TournamentId == request.TournamentId && m.MatchOrder != null)
            .Select(m => m.MatchOrder!.Value)
            .OrderByDescending(o => o)
            .FirstOrDefaultAsync()) + 1;

        var match = new Match
        {
            TournamentId = tournament.Id,
            RoundId = round?.Id,
            GroupId = group?.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            VenueId = request.VenueId,
            MatchDate = request.MatchDate!.Value,
            MatchStatus = MatchStatus.SCHEDULED,
            MatchOrder = matchOrder,
            HomeTeamScore = 0,
            AwayTeamScore = 0,
            ElapsedTimeSeconds = 0,
            IsPlaceholderMatch = false,
            MatchDurationMinutes = request.MatchDurationMinutes,
            GroupName = request.GroupName ?? group?.GroupName,
            LegacyRound = round?.RoundNumber,
        };

        db.Matches.Add(match);
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "MATCH_CREATED");
        return ToResponse(match, tournament, homeTeam, awayTeam);
    }

    public async Task DeleteMatchAsync(long matchId)
    {
        var match = await GetMatchEntityAsync(matchId);
        var tournamentId = match.TournamentId;

        if (match.MatchStatus is MatchStatus.ONGOING or MatchStatus.PAUSED)
        {
            throw new TournamentServiceException("Cannot delete ongoing or paused matches", HttpStatusCode.Conflict);
        }
        if (match.MatchStatus == MatchStatus.COMPLETED)
        {
            throw new TournamentServiceException("Cannot delete completed matches", HttpStatusCode.Conflict);
        }

        db.Matches.Remove(match);
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(tournamentId, matchId, "MATCH_DELETED");
    }

    public async Task UpdateMatchOrderAsync(MatchOrderUpdateRequest request)
    {
        var touchedTournamentIds = new HashSet<long>();
        foreach (var item in request.MatchOrders)
        {
            var match = await db.Matches.FirstOrDefaultAsync(m => m.Id == item.MatchId)
                ?? throw new TournamentServiceException($"Match not found with ID: {item.MatchId}", HttpStatusCode.NotFound);
            match.MatchOrder = item.MatchOrder;
            touchedTournamentIds.Add(match.TournamentId);
        }
        await db.SaveChangesAsync();

        foreach (var tournamentId in touchedTournamentIds)
        {
            liveMatchUpdatePublisher.PublishMatchUpdate(tournamentId, null, "MATCH_ORDER_UPDATED");
        }
    }

    // === Private helpers ===

    private async Task<Match> GetMatchEntityAsync(long matchId) =>
        await db.Matches.Include(m => m.Tournament).Include(m => m.HomeTeam).Include(m => m.AwayTeam).Include(m => m.Venue)
            .Include(m => m.Round).Include(m => m.Group)
            .FirstOrDefaultAsync(m => m.Id == matchId)
        ?? throw new TournamentServiceException("Match not found", HttpStatusCode.NotFound);

    private async Task<int> CountPlayerEventsAsync(long matchId, long playerId, MatchEventType type) =>
        await db.MatchEvents.CountAsync(e => e.MatchId == matchId && e.PlayerId == playerId && e.EventType == type);

    private async Task ValidateMatchEventAsync(Match match, MatchEventRequest request, Player player, Team team, Player? relatedPlayer)
    {
        var homeTeamId = match.HomeTeamId;
        var awayTeamId = match.AwayTeamId;

        if (team.Id != homeTeamId && team.Id != awayTeamId)
        {
            throw new TournamentServiceException("Selected team is not part of this match", HttpStatusCode.BadRequest);
        }

        if (!await db.TeamPlayers.AnyAsync(tp => tp.TeamId == team.Id && tp.PlayerId == player.Id))
        {
            throw new TournamentServiceException("Player is not part of the selected team", HttpStatusCode.BadRequest);
        }

        if (relatedPlayer != null && !await db.TeamPlayers.AnyAsync(tp => tp.TeamId == team.Id && tp.PlayerId == relatedPlayer.Id))
        {
            throw new TournamentServiceException("Related player must be from the same team", HttpStatusCode.BadRequest);
        }

        if (request.EventType == MatchEventType.RED_CARD)
        {
            var redCardCount = await CountPlayerEventsAsync(match.Id, player.Id, MatchEventType.RED_CARD);
            if (redCardCount >= 1)
            {
                throw new TournamentServiceException("Player already has a red card in this match", HttpStatusCode.Conflict);
            }
        }

        if (request.EventType == MatchEventType.YELLOW_CARD)
        {
            var yellowCardCount = await CountPlayerEventsAsync(match.Id, player.Id, MatchEventType.YELLOW_CARD);
            var redCardCount = await CountPlayerEventsAsync(match.Id, player.Id, MatchEventType.RED_CARD);

            if (redCardCount >= 1)
            {
                throw new TournamentServiceException(
                    "Cannot give a yellow card to a player who already has a red card in this match", HttpStatusCode.Conflict);
            }
            if (yellowCardCount >= 2)
            {
                throw new TournamentServiceException(
                    "Player cannot receive more than two yellow cards in this match", HttpStatusCode.Conflict);
            }
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
            // Matches Java's catch-and-log pattern: these are best-effort side effects that
            // must never fail the primary match-lifecycle operation.
            logger.LogWarning(ex, "Failed to {Description}", description);
        }
    }

    private static MatchResponse ToResponse(Match match) => ToResponse(match, match.Tournament, match.HomeTeam, match.AwayTeam);

    private static MatchResponse ToResponse(Match match, Tournament tournament, Team homeTeam, Team awayTeam)
    {
        var roundNumber = match.Round?.RoundNumber ?? match.LegacyRound;
        var groupName = match.GroupName ?? match.Group?.GroupName;

        return new MatchResponse
        {
            Id = match.Id,
            TournamentId = tournament.Id,
            TournamentName = tournament.Name,
            HomeTeamId = homeTeam.Id,
            HomeTeamName = homeTeam.TeamName,
            AwayTeamId = awayTeam.Id,
            AwayTeamName = awayTeam.TeamName,
            VenueId = match.Venue?.Id,
            VenueName = match.Venue?.Name,
            VenueMapLink = match.Venue?.MapLink,
            MatchDate = match.MatchDate,
            MatchStatus = match.MatchStatus.ToString(),
            MatchOrder = match.MatchOrder,
            Round = match.LegacyRound,
            RoundNumber = roundNumber,
            GroupName = groupName,
            HomeTeamScore = match.HomeTeamScore,
            AwayTeamScore = match.AwayTeamScore,
            MatchDurationMinutes = match.MatchDurationMinutes,
            ElapsedTimeSeconds = match.ElapsedTimeSeconds,
            StartedAt = match.StartedAt,
            CompletedAt = match.CompletedAt,
            CreatedDate = match.CreatedDate,
            UpdatedDate = match.UpdatedDate,
        };
    }

    private async Task<MatchEventResponse> ToResponseAsync(MatchEvent matchEvent)
    {
        var player = matchEvent.PlayerId != null ? await db.Players.FirstOrDefaultAsync(p => p.Id == matchEvent.PlayerId) : null;
        var team = matchEvent.TeamId != null ? await db.Teams.FirstOrDefaultAsync(t => t.Id == matchEvent.TeamId) : null;
        var relatedPlayer = matchEvent.RelatedPlayerId != null
            ? await db.Players.FirstOrDefaultAsync(p => p.Id == matchEvent.RelatedPlayerId)
            : null;
        return ToResponse(matchEvent, player, team, relatedPlayer);
    }

    private static MatchEventResponse ToResponse(MatchEvent matchEvent, Player? player, Team? team, Player? relatedPlayer)
    {
        // System events (MATCH_STARTED/MATCH_COMPLETED) carry the admin as "player" and the
        // home team as a DB-constraint placeholder — hide the placeholder team in the response.
        var isSystemEvent = matchEvent.EventType is MatchEventType.MATCH_STARTED or MatchEventType.MATCH_COMPLETED;

        return new MatchEventResponse
        {
            Id = matchEvent.Id,
            MatchId = matchEvent.MatchId,
            EventType = matchEvent.EventType.ToString(),
            PlayerId = player?.Id,
            PlayerName = player?.Name,
            TeamId = isSystemEvent ? null : team?.Id,
            TeamName = isSystemEvent ? null : team?.TeamName,
            EventTime = matchEvent.EventTime,
            Description = matchEvent.Description,
            RelatedPlayerId = relatedPlayer?.Id,
            RelatedPlayerName = relatedPlayer?.Name,
            Details = matchEvent.Details,
            CreatedDate = matchEvent.CreatedDate,
        };
    }
}
