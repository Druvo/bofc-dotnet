using BofcBackend.Api.Features.Statistics.Models;

namespace BofcBackend.Api.Features.Matches;

/// <summary>Port of service/MatchStatisticsService.java.</summary>
public interface IMatchStatisticsService
{
    Task<MatchStatisticsResponse> GetPlayerMatchStatisticsAsync(long matchId, long playerId);
    Task<List<PlayerMatchHistoryResponse>> GetPlayerMatchHistoryAsync(long playerId);
    Task<List<MatchStatisticsResponse>> GetMatchStatisticsAsync(long matchId);
    Task<List<MatchStatisticsResponse>> GetTeamMatchStatisticsAsync(long matchId, long teamId);
    Task<List<MatchStatisticsResponse>> GetPlayerMatchDayStatisticsAsync(long matchDayId, long playerId);
    Task<List<MatchStatisticsResponse>> GetTopScorersByMatchDayAsync(long matchDayId);
    Task<List<MatchStatisticsResponse>> GetTopAssistProvidersByMatchDayAsync(long matchDayId);
    Task<List<MatchDayStandingResponse>> GetMatchDayStandingsAsync(long matchDayId);

    /// <summary>Aggregates statistics from match events to update player statistics — also called by MatchManagementService lifecycle transitions.</summary>
    Task AggregateMatchStatisticsAsync(long matchId);

    Task<long> GetTeamTotalGoalsInMatchDayAsync(long matchDayId, long teamId);
    Task<int> GetPlayerTotalDisciplinaryCardsInMatchDayAsync(long matchDayId, long playerId);
    Task<List<MatchStatisticsResponse>> GetTopCardReceiversByMatchDayAsync(long matchDayId);
}
