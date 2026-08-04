using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Statistics.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Statistics;

/// <summary>
/// Port of service/PlayerStatisticsServiceImpl.java. The two backing JPQL queries in Java
/// (MatchEventRepository.findAggregatedPlayerStatisticsFromEvents /findTopScorersByTournament)
/// use a LEFT JOIN with a non-equality ON clause (player OR relatedPlayer, further ANDed with
/// an optional tournament filter) plus a correlated COUNT(DISTINCT) subquery — that shape has
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
        var tournamentId = filter.TournamentId;

        var playerQuery = db.Players.AsQueryable();
        if (tournamentId != null)
        {
            playerQuery = playerQuery.Where(p =>
                db.TeamPlayers.Any(tp => tp.PlayerId == p.Id && tp.Team.TournamentId == tournamentId));
        }

        var aggregated = await playerQuery.Select(p => new Aggregate
        {
            PlayerId = p.Id,
            PlayerName = p.Name,
            Position = p.Position,
            GoalsScored = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL && me.PlayerId == p.Id
                && (tournamentId == null || me.Match.TournamentId == tournamentId)),
            Assists = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL && me.RelatedPlayerId == p.Id
                && (tournamentId == null || me.Match.TournamentId == tournamentId)),
            MatchesPlayed = db.Matches
                .Where(m => m.MatchStatus == MatchStatus.COMPLETED && (tournamentId == null || m.TournamentId == tournamentId)
                    && db.TeamPlayers.Any(tp2 => tp2.PlayerId == p.Id && (tp2.TeamId == m.HomeTeamId || tp2.TeamId == m.AwayTeamId)))
                .Select(m => m.Id).Distinct().Count(),
            YellowCards = db.MatchEvents.Count(me => me.EventType == MatchEventType.YELLOW_CARD && me.PlayerId == p.Id
                && (tournamentId == null || me.Match.TournamentId == tournamentId)),
            RedCards = db.MatchEvents.Count(me => me.EventType == MatchEventType.RED_CARD && me.PlayerId == p.Id
                && (tournamentId == null || me.Match.TournamentId == tournamentId)),
        }).ToListAsync();

        if (filter.Position != null)
        {
            aggregated = aggregated.Where(a => a.Position == filter.Position).ToList();
        }

        var responses = aggregated.Select(ToResponse).ToList();
        responses = ApplySorting(responses, filter.SortBy, filter.SortOrder);
        return ApplyPagination(responses, filter.Offset, filter.Limit);
    }

    public async Task<List<TournamentTopScorerResponse>> GetTopScorersByTournamentAsync(long tournamentId, int limit)
    {
        var rows = await db.TeamPlayers
            .Where(tp => tp.Team.TournamentId == tournamentId)
            .Select(tp => new TournamentTopScorerResponse
            {
                PlayerId = tp.PlayerId,
                PlayerName = tp.Player.Name,
                TeamId = tp.TeamId,
                TeamName = tp.Team.TeamName,
                Position = tp.PlayingPosition.ToString(),
                GoalsScored = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL
                    && me.PlayerId == tp.PlayerId && me.Match.TournamentId == tournamentId),
                Assists = db.MatchEvents.Count(me => me.EventType == MatchEventType.GOAL
                    && me.RelatedPlayerId == tp.PlayerId && me.Match.TournamentId == tournamentId),
                // Team's total completed matches in the tournament — not scoped to matches the
                // player personally appeared in. This mirrors a quirk already present in the
                // Java query (matchesPlayed here is team-wide, unlike the per-player subquery
                // used in the other aggregation method above); not this port's place to fix it.
                MatchesPlayed = db.Matches
                    .Where(m => (m.HomeTeamId == tp.TeamId || m.AwayTeamId == tp.TeamId)
                        && m.MatchStatus == MatchStatus.COMPLETED && m.TournamentId == tournamentId)
                    .Select(m => m.Id).Distinct().Count(),
            })
            .OrderByDescending(r => r.GoalsScored)
            .Take(limit)
            .ToListAsync();

        return rows;
    }

    private static PlayerStatisticsResponse ToResponse(Aggregate a) => new()
    {
        PlayerId = a.PlayerId,
        PlayerName = a.PlayerName,
        Position = a.Position.ToString(),
        Statistics = new PlayerStatisticsResponse.StatisticsSummary
        {
            MatchesPlayed = (int)a.MatchesPlayed,
            GoalsScored = (int)a.GoalsScored,
            Assists = (int)a.Assists,
            GoalsAndAssists = (int)(a.GoalsScored + a.Assists),
            YellowCards = (int)a.YellowCards,
            RedCards = (int)a.RedCards,
        },
    };

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
