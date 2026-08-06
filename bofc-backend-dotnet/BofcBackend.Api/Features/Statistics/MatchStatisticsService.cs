using System.Net;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Matches;
using BofcBackend.Api.Features.Statistics.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Statistics;

/// <summary>Port of service/MatchStatisticsServiceImpl.java.</summary>
public class MatchStatisticsService(BofcDbContext db) : IMatchStatisticsService
{
    public async Task<MatchStatisticsResponse> GetPlayerMatchStatisticsAsync(long matchId, long playerId)
    {
        var stats = await db.MatchStatistics.Include(s => s.Player).Include(s => s.Team)
            .FirstOrDefaultAsync(s => s.MatchId == matchId && s.PlayerId == playerId)
            ?? throw new MatchDayServiceException("Statistics not found", HttpStatusCode.NotFound);
        return ToResponse(stats);
    }

    public async Task<List<MatchStatisticsResponse>> GetMatchStatisticsAsync(long matchId)
    {
        var stats = await db.MatchStatistics.Include(s => s.Player).Include(s => s.Team)
            .Where(s => s.MatchId == matchId).OrderByDescending(s => s.GoalsScored).ToListAsync();
        return stats.Select(ToResponse).ToList();
    }

    public async Task<List<MatchStatisticsResponse>> GetTeamMatchStatisticsAsync(long matchId, long teamId)
    {
        var stats = await db.MatchStatistics.Include(s => s.Player).Include(s => s.Team)
            .Where(s => s.MatchId == matchId && s.TeamId == teamId).OrderByDescending(s => s.GoalsScored).ToListAsync();
        return stats.Select(ToResponse).ToList();
    }

    public async Task<List<MatchStatisticsResponse>> GetPlayerMatchDayStatisticsAsync(long matchDayId, long playerId)
    {
        var stats = await db.MatchStatistics.Include(s => s.Player).Include(s => s.Team).Include(s => s.Match)
            .Where(s => s.Match.MatchDayId == matchDayId && s.PlayerId == playerId)
            .OrderBy(s => s.Match.MatchDate).ToListAsync();
        return stats.Select(ToResponse).ToList();
    }

    public async Task<List<PlayerMatchHistoryResponse>> GetPlayerMatchHistoryAsync(long playerId)
    {
        // Scope to matches of teams the player actually belongs to (via TeamPlayer roster),
        // falling back to all of his stat rows if he has no roster entries at all — matches
        // Java's findPlayerMatchHistory query exactly.
        var rows = await db.MatchStatistics
            .Include(s => s.Match).ThenInclude(m => m.MatchDay)
            .Include(s => s.Match).ThenInclude(m => m.HomeTeam)
            .Include(s => s.Match).ThenInclude(m => m.AwayTeam)
            .Include(s => s.Team)
            .Where(s => s.PlayerId == playerId
                && s.Match.MatchStatus == MatchStatus.COMPLETED
                && (db.TeamPlayers.Any(tp => tp.PlayerId == playerId && tp.TeamId == s.TeamId)
                    || !db.TeamPlayers.Any(tp => tp.PlayerId == playerId)))
            .OrderByDescending(s => s.Match.MatchDate)
            .ToListAsync();

        if (rows.Count == 0)
        {
            return [];
        }

        // Group the player's stat rows per match (data can carry more than one row per
        // match); the first row supplies the match/team context.
        var byMatch = new Dictionary<long, List<MatchStatistics>>();
        var matchOrder = new List<long>();
        foreach (var row in rows)
        {
            if (!byMatch.TryGetValue(row.MatchId, out var list))
            {
                list = [];
                byMatch[row.MatchId] = list;
                matchOrder.Add(row.MatchId);
            }
            list.Add(row);
        }

        // Also count goals/assists/cards from the recorded match events.
        var matchIds = byMatch.Keys.ToList();
        var events = await db.MatchEvents.Where(e => e.PlayerId == playerId && matchIds.Contains(e.MatchId)).ToListAsync();
        var eventCounts = new Dictionary<long, int[]>(); // [goals, assists, yellow, red]
        foreach (var ev in events)
        {
            if (!eventCounts.TryGetValue(ev.MatchId, out var counts))
            {
                counts = new int[4];
                eventCounts[ev.MatchId] = counts;
            }
            switch (ev.EventType)
            {
                case MatchEventType.GOAL: counts[0]++; break;
                case MatchEventType.ASSIST: counts[1]++; break;
                case MatchEventType.YELLOW_CARD: counts[2]++; break;
                case MatchEventType.RED_CARD: counts[3]++; break;
            }
        }

        // Per match, take the greater of the aggregated stats and the recorded events for
        // each metric, so a contribution shows if either source has it.
        var history = new List<PlayerMatchHistoryResponse>();
        foreach (var matchId in matchOrder)
        {
            var msList = byMatch[matchId];
            var rep = msList[0];
            var statGoals = msList.Sum(s => s.GoalsScored);
            var statAssists = msList.Sum(s => s.Assists);
            var statYellow = msList.Sum(s => s.YellowCards);
            var statRed = msList.Sum(s => s.RedCards);
            var ev = eventCounts.GetValueOrDefault(matchId, new int[4]);

            history.Add(ToHistoryResponse(rep,
                Math.Max(statGoals, ev[0]), Math.Max(statAssists, ev[1]),
                Math.Max(statYellow, ev[2]), Math.Max(statRed, ev[3])));
        }
        return history;
    }

    public async Task<List<MatchStatisticsResponse>> GetTopScorersByMatchDayAsync(long matchDayId)
    {
        var aggregated = await AggregateByMatchDayAsync(matchDayId);
        return aggregated.OrderByDescending(r => r.GoalsScored).ToList();
    }

    public async Task<List<MatchStatisticsResponse>> GetTopAssistProvidersByMatchDayAsync(long matchDayId)
    {
        var aggregated = await AggregateByMatchDayAsync(matchDayId);
        return aggregated.OrderByDescending(r => r.Assists).ToList();
    }

    public async Task<List<MatchStatisticsResponse>> GetTopCardReceiversByMatchDayAsync(long matchDayId)
    {
        var aggregated = await AggregateByMatchDayAsync(matchDayId);
        return aggregated.OrderByDescending(r => r.RedCards + r.YellowCards).ToList();
    }

    /// <summary>
    /// Aggregates raw MatchStatistics rows by player (first-seen row supplies player/team
    /// context — matches Java's Map-based aggregation exactly, including the quirk that a
    /// player who played for multiple teams in the MatchDay shows only the first team seen).
    /// </summary>
    private async Task<List<MatchStatisticsResponse>> AggregateByMatchDayAsync(long matchDayId)
    {
        var stats = await db.MatchStatistics.Include(s => s.Player).Include(s => s.Team).Include(s => s.Match)
            .Where(s => s.Match.MatchDayId == matchDayId).ToListAsync();

        var aggregated = new Dictionary<long, MatchStatisticsResponse>();
        foreach (var stat in stats)
        {
            if (aggregated.TryGetValue(stat.PlayerId, out var existing))
            {
                existing.GoalsScored += stat.GoalsScored;
                existing.Assists += stat.Assists;
                existing.RedCards += stat.RedCards;
                existing.YellowCards += stat.YellowCards;
                existing.MinutesPlayed += stat.MinutesPlayed;
            }
            else
            {
                aggregated[stat.PlayerId] = ToResponse(stat);
            }
        }
        return aggregated.Values.ToList();
    }

    public async Task<List<MatchDayStandingResponse>> GetMatchDayStandingsAsync(long matchDayId)
    {
        var matches = await db.Matches
            .Where(m => m.MatchDayId == matchDayId && m.MatchStatus == MatchStatus.COMPLETED)
            .ToListAsync();
        var teams = await db.Teams.Where(t => t.MatchDayId == matchDayId).ToListAsync();

        var standings = teams.ToDictionary(t => t.Id, t => new MatchDayStandingResponse
        {
            TeamId = t.Id,
            TeamName = t.TeamName,
        });

        foreach (var match in matches)
        {
            if (!standings.TryGetValue(match.HomeTeamId, out var home) || !standings.TryGetValue(match.AwayTeamId, out var away))
            {
                continue;
            }

            home.GoalsFor += match.HomeTeamScore;
            home.GoalsAgainst += match.AwayTeamScore;
            home.Matches += 1;
            away.GoalsFor += match.AwayTeamScore;
            away.GoalsAgainst += match.HomeTeamScore;
            away.Matches += 1;

            if (match.HomeTeamScore > match.AwayTeamScore)
            {
                home.Points += 3;
                home.Wins += 1;
                away.Losses += 1;
            }
            else if (match.HomeTeamScore < match.AwayTeamScore)
            {
                away.Points += 3;
                away.Wins += 1;
                home.Losses += 1;
            }
            else
            {
                home.Points += 1;
                home.Draws += 1;
                away.Points += 1;
                away.Draws += 1;
            }
        }

        foreach (var s in standings.Values)
        {
            s.GoalDifference = s.GoalsFor - s.GoalsAgainst;
        }

        return standings.Values
            .OrderByDescending(s => s.Points)
            .ThenByDescending(s => s.GoalDifference)
            .ToList();
    }

    public async Task AggregateMatchStatisticsAsync(long matchId)
    {
        var match = await db.Matches.FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new MatchDayServiceException("Match not found", HttpStatusCode.NotFound);

        var matchEvents = await db.MatchEvents.Where(e => e.MatchId == matchId).ToListAsync();
        var playerStats = new Dictionary<long, MatchStatistics>();

        MatchStatistics GetOrCreateStats(long playerId, long? teamId)
        {
            if (playerStats.TryGetValue(playerId, out var existing))
            {
                return existing;
            }
            var playerEvent = matchEvents.FirstOrDefault(e => e.PlayerId == playerId);
            var stats = new MatchStatistics
            {
                MatchId = match.Id,
                PlayerId = playerEvent?.PlayerId ?? playerId,
                TeamId = teamId ?? 0,
                GoalsScored = 0,
                Assists = 0,
                RedCards = 0,
                YellowCards = 0,
                SubstitutionIn = 0,
                SubstitutionOut = 0,
                MinutesPlayed = 0,
            };
            playerStats[playerId] = stats;
            return stats;
        }

        foreach (var ev in matchEvents)
        {
            if (ev.PlayerId is not { } playerId)
            {
                continue;
            }

            var stats = GetOrCreateStats(playerId, ev.TeamId);

            switch (ev.EventType)
            {
                case MatchEventType.GOAL:
                    stats.GoalsScored += 1;
                    if (ev.RelatedPlayerId is { } assistPlayerId)
                    {
                        var assistStats = GetOrCreateStats(assistPlayerId, ev.TeamId);
                        assistStats.Assists += 1;
                    }
                    break;
                case MatchEventType.ASSIST:
                    stats.Assists += 1;
                    break;
                case MatchEventType.RED_CARD:
                    if (stats.RedCards == 0)
                    {
                        stats.RedCards = 1;
                    }
                    break;
                case MatchEventType.YELLOW_CARD:
                    if (stats.YellowCards < 2)
                    {
                        stats.YellowCards += 1;
                    }
                    break;
                case MatchEventType.SUBSTITUTION:
                    if (ev.Description == "IN")
                    {
                        stats.SubstitutionIn += 1;
                    }
                    else
                    {
                        stats.SubstitutionOut += 1;
                    }
                    break;
            }
        }

        // Clear existing statistics for this match to avoid duplicates, then save the fresh aggregate.
        var existingRows = await db.MatchStatistics.Where(s => s.MatchId == matchId).ToListAsync();
        db.MatchStatistics.RemoveRange(existingRows);
        db.MatchStatistics.AddRange(playerStats.Values);
        await db.SaveChangesAsync();
    }

    public async Task<long> GetTeamTotalGoalsInMatchDayAsync(long matchDayId, long teamId) =>
        await db.MatchStatistics.Where(s => s.Match.MatchDayId == matchDayId && s.TeamId == teamId)
            .SumAsync(s => (long)s.GoalsScored);

    public async Task<int> GetPlayerTotalDisciplinaryCardsInMatchDayAsync(long matchDayId, long playerId)
    {
        var query = db.MatchStatistics.Where(s => s.Match.MatchDayId == matchDayId && s.PlayerId == playerId);
        var redCards = await query.SumAsync(s => (int?)s.RedCards) ?? 0;
        var yellowCards = await query.SumAsync(s => (int?)s.YellowCards) ?? 0;
        return redCards + yellowCards;
    }

    private static MatchStatisticsResponse ToResponse(MatchStatistics stats) => new()
    {
        Id = stats.Id,
        MatchId = stats.MatchId,
        PlayerId = stats.PlayerId,
        PlayerName = stats.Player.Name,
        TeamId = stats.TeamId,
        TeamName = stats.Team.TeamName,
        GoalsScored = stats.GoalsScored,
        Assists = stats.Assists,
        RedCards = stats.RedCards,
        YellowCards = stats.YellowCards,
        SubstitutionIn = stats.SubstitutionIn,
        SubstitutionOut = stats.SubstitutionOut,
        MinutesPlayed = stats.MinutesPlayed,
    };

    private static PlayerMatchHistoryResponse ToHistoryResponse(MatchStatistics ms, int goals, int assists, int yellowCards, int redCards)
    {
        var match = ms.Match;
        var playerTeam = ms.Team;
        var home = match.HomeTeam;
        var away = match.AwayTeam;

        var isHome = playerTeam.Id == home.Id;
        var opponent = isHome ? away : home;
        var teamScore = isHome ? match.HomeTeamScore : match.AwayTeamScore;
        var opponentScore = isHome ? match.AwayTeamScore : match.HomeTeamScore;
        var result = teamScore > opponentScore ? "WIN" : teamScore < opponentScore ? "LOSS" : "DRAW";

        return new PlayerMatchHistoryResponse
        {
            MatchId = match.Id,
            MatchDate = match.MatchDate,
            MatchDayName = match.MatchDay?.Name,
            TeamId = playerTeam.Id,
            TeamName = playerTeam.TeamName,
            OpponentTeamName = opponent.TeamName,
            TeamScore = teamScore,
            OpponentScore = opponentScore,
            Result = result,
            GoalsScored = goals,
            Assists = assists,
            YellowCards = yellowCards,
            RedCards = redCards,
            MinutesPlayed = ms.MinutesPlayed,
        };
    }
}
