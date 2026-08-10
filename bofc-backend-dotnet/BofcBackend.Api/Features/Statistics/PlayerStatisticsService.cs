using System.Net;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Statistics.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Statistics;

/// <summary>
/// Port of service/PlayerStatisticsServiceImpl.java. The two backing JPQL queries in Java
/// (MatchEventRepository.findAggregatedPlayerStatisticsFromEvents /findTopScorersByMatchDay)
/// use a LEFT JOIN with a non-equality ON clause (player OR relatedPlayer, further ANDed with
/// an optional MatchDay filter) plus a correlated COUNT(DISTINCT) subquery - that shape has
/// no direct LINQ equivalent (EF Core LEFT JOINs key off equality). Restructured here as one
/// independent correlated subquery per metric instead of a single combined join+GROUP BY;
/// this is semantically identical (each metric already summed a mutually-exclusive per-row
/// CASE in the original, so splitting it into separate counts changes nothing) and reads more
/// clearly in LINQ than forcing the original join shape.
/// </summary>
public class PlayerStatisticsService(BofcDbContext db) : IPlayerStatisticsService
{
    private class Aggregate
    {
        public long PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public FootballPosition Position { get; set; }
        public long GoalsScored { get; set; }
        public long Assists { get; set; }
        public long MatchesPlayed { get; set; }
        public long YellowCards { get; set; }
        public long RedCards { get; set; }
    }

    public async Task<List<PlayerStatisticsResponse>> GetPlayerStatisticsAsync(PlayerStatisticsFilterRequest filter)
    {
        var matchDayId = filter.MatchDayId;

        // Normalize both scoping modes (single MatchDay / season-cumulative Match Days) into
        // one nullable Id list: null = no restriction, non-null = must be one of these. A local
        // C# method wouldn't translate into SQL here, so this "resolve once, then only ever use
        // captured-variable null-checks + List.Contains" shape is what keeps every query below
        // translatable by EF Core.
        List<long>? scopeIds = null;
        if (matchDayId != null)
        {
            scopeIds = [matchDayId.Value];
        }
        else if (filter.WeeklyMatchDaysOnly)
        {
            scopeIds = await db.MatchDays.Where(t => t.IsWeeklyMatchDay).Select(t => t.Id).ToListAsync();
        }

        var playerQuery = db.Players.AsQueryable();
        if (scopeIds != null)
        {
            playerQuery = playerQuery.Where(p =>
                db.TeamPlayers.Any(tp => tp.PlayerId == p.Id && scopeIds.Contains(tp.Team.MatchDayId)));
        }

        var aggregated = await playerQuery.Select(p => new Aggregate
        {
            PlayerId = p.Id,
            PlayerName = p.Name,
            Position = p.Position,
            GoalsScored = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL && me.PlayerId == p.Id
                && (scopeIds == null || scopeIds.Contains(me.Match.MatchDayId))),
            Assists = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL && me.RelatedPlayerId == p.Id
                && (scopeIds == null || scopeIds.Contains(me.Match.MatchDayId))),
            MatchesPlayed = db.Matches
                .Where(m => m.MatchStatus == MatchStatus.COMPLETED && (scopeIds == null || scopeIds.Contains(m.MatchDayId))
                    && db.TeamPlayers.Any(tp2 => tp2.PlayerId == p.Id && (tp2.TeamId == m.HomeTeamId || tp2.TeamId == m.AwayTeamId)))
                .Select(m => m.Id).Distinct().Count(),
            YellowCards = db.MatchEvents.Count(me => me.EventType == MatchEventType.YELLOW_CARD && me.PlayerId == p.Id
                && (scopeIds == null || scopeIds.Contains(me.Match.MatchDayId))),
            RedCards = db.MatchEvents.Count(me => me.EventType == MatchEventType.RED_CARD && me.PlayerId == p.Id
                && (scopeIds == null || scopeIds.Contains(me.Match.MatchDayId))),
        }).ToListAsync();

        if (filter.Position != null)
        {
            aggregated = aggregated.Where(a => a.Position == filter.Position).ToList();
        }

        // Manual corrections (PlayerStatAdjustment) represent a lifetime/overall total, not any
        // single MatchDay's play - folding them into a single-MatchDay view (matchDayId set)
        // would misattribute them to that one day, so they only apply to the "all MatchDays"
        // aggregate (whether or not WeeklyMatchDaysOnly narrows which MatchDays count).
        var adjustments = matchDayId == null
            ? await db.PlayerStatAdjustments.AsNoTracking().Where(a => a.MatchId == null).ToDictionaryAsync(a => a.PlayerId)
            : new Dictionary<long, PlayerStatAdjustment>();

        var responses = aggregated.Select(a => ToResponse(a, adjustments.GetValueOrDefault(a.PlayerId))).ToList();
        responses = ApplySorting(responses, filter.SortBy, filter.SortOrder);
        return ApplyPagination(responses, filter.Offset, filter.Limit);
    }

    public async Task<PlayerStatAdjustmentResponse> GetPlayerStatAdjustmentAsync(long playerId, long? matchId)
    {
        var adjustment = await db.PlayerStatAdjustments.AsNoTracking()
            .FirstOrDefaultAsync(a => a.PlayerId == playerId && a.MatchId == matchId);
        return ToAdjustmentResponse(playerId, matchId, adjustment);
    }

    public async Task<PlayerStatAdjustmentResponse> UpdatePlayerStatAdjustmentAsync(long playerId, long? matchId, UpdatePlayerStatAdjustmentRequest request)
    {
        if (!await db.Players.AnyAsync(p => p.Id == playerId))
        {
            throw new PlayerServiceException("Player not found", HttpStatusCode.NotFound);
        }

        if (matchId != null && !await db.Matches.AnyAsync(m => m.Id == matchId))
        {
            throw new MatchDayServiceException("Match not found", HttpStatusCode.NotFound);
        }

        var adjustment = await db.PlayerStatAdjustments.FirstOrDefaultAsync(a => a.PlayerId == playerId && a.MatchId == matchId);
        if (adjustment == null)
        {
            adjustment = new PlayerStatAdjustment { PlayerId = playerId, MatchId = matchId };
            db.PlayerStatAdjustments.Add(adjustment);
        }

        adjustment.GoalsAdjustment = request.GoalsAdjustment;
        adjustment.AssistsAdjustment = request.AssistsAdjustment;
        adjustment.YellowCardsAdjustment = request.YellowCardsAdjustment;
        adjustment.RedCardsAdjustment = request.RedCardsAdjustment;
        adjustment.MatchesPlayedAdjustment = request.MatchesPlayedAdjustment;
        adjustment.Note = request.Note?.Trim();

        await db.SaveChangesAsync();
        return ToAdjustmentResponse(playerId, matchId, adjustment);
    }

    private static PlayerStatAdjustmentResponse ToAdjustmentResponse(long playerId, long? matchId, PlayerStatAdjustment? a) => new()
    {
        PlayerId = playerId,
        MatchId = matchId,
        GoalsAdjustment = a?.GoalsAdjustment ?? 0,
        AssistsAdjustment = a?.AssistsAdjustment ?? 0,
        YellowCardsAdjustment = a?.YellowCardsAdjustment ?? 0,
        RedCardsAdjustment = a?.RedCardsAdjustment ?? 0,
        MatchesPlayedAdjustment = a?.MatchesPlayedAdjustment ?? 0,
        Note = a?.Note,
    };

    public async Task<List<MatchDayTopScorerResponse>> GetTopScorersByMatchDayAsync(long matchDayId, int limit)
    {
        var rows = await db.TeamPlayers
            .Where(tp => tp.Team.MatchDayId == matchDayId)
            .Select(tp => new MatchDayTopScorerResponse
            {
                PlayerId = tp.PlayerId,
                PlayerName = tp.Player.Name,
                TeamId = tp.TeamId,
                TeamName = tp.Team.TeamName,
                Position = tp.PlayingPosition.ToString(),
                GoalsScored = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL
                    && me.PlayerId == tp.PlayerId && me.Match.MatchDayId == matchDayId),
                Assists = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL
                    && me.RelatedPlayerId == tp.PlayerId && me.Match.MatchDayId == matchDayId),
                // Team's total completed matches in the MatchDay - not scoped to matches the
                // player personally appeared in. This mirrors a quirk already present in the
                // Java query (matchesPlayed here is team-wide, unlike the per-player subquery
                // used in the other aggregation method above); not this port's place to fix it.
                MatchesPlayed = db.Matches
                    .Where(m => (m.HomeTeamId == tp.TeamId || m.AwayTeamId == tp.TeamId)
                        && m.MatchStatus == MatchStatus.COMPLETED && m.MatchDayId == matchDayId)
                    .Select(m => m.Id).Distinct().Count(),
            })
            .OrderByDescending(r => r.GoalsScored)
            .Take(limit)
            .ToListAsync();

        return rows;
    }

    private static PlayerStatisticsResponse ToResponse(Aggregate a, PlayerStatAdjustment? adjustment)
    {
        var goals = (int)a.GoalsScored + (adjustment?.GoalsAdjustment ?? 0);
        var assists = (int)a.Assists + (adjustment?.AssistsAdjustment ?? 0);
        return new PlayerStatisticsResponse
        {
            PlayerId = a.PlayerId,
            PlayerName = a.PlayerName,
            Position = a.Position.ToString(),
            Statistics = new PlayerStatisticsResponse.StatisticsSummary
            {
                MatchesPlayed = (int)a.MatchesPlayed + (adjustment?.MatchesPlayedAdjustment ?? 0),
                GoalsScored = goals,
                Assists = assists,
                GoalsAndAssists = goals + assists,
                YellowCards = (int)a.YellowCards + (adjustment?.YellowCardsAdjustment ?? 0),
                RedCards = (int)a.RedCards + (adjustment?.RedCardsAdjustment ?? 0),
            },
        };
    }

    private static List<PlayerStatisticsResponse> ApplySorting(List<PlayerStatisticsResponse> players, string sortBy, string sortOrder)
    {
        Func<PlayerStatisticsResponse, int> keySelector = sortBy.ToLowerInvariant() switch
        {
            "assists" => p => p.Statistics.Assists,
            "goalsassists" or "goals+assists" => p => p.Statistics.GoalsAndAssists,
            "matches" => p => p.Statistics.MatchesPlayed,
            _ => p => p.Statistics.GoalsScored,
        };

        return string.Equals(sortOrder, "ASC", StringComparison.OrdinalIgnoreCase)
            ? players.OrderBy(keySelector).ToList()
            : players.OrderByDescending(keySelector).ToList();
    }

    private static List<PlayerStatisticsResponse> ApplyPagination(List<PlayerStatisticsResponse> players, int offset, int limit)
    {
        if (offset >= players.Count)
        {
            return [];
        }
        var toIndex = Math.Min(offset + limit, players.Count);
        return players.GetRange(offset, toIndex - offset);
    }
}
