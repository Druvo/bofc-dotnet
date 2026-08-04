using BofcBackend.Api.Features.Statistics.Models;

namespace BofcBackend.Api.Features.Matches;

/// <summary>Port of service/MatchStatisticsService.java.</summary>
public interface IMatchStatisticsService
{
    Task<MatchStatisticsResponse> GetPlayerMatchStatisticsAsync(long matchId, long playerId);
    Task<List<PlayerMatchHistoryResponse>> GetPlayerMatchHistoryAsync(long playerId);
    Task<List<MatchStatisticsResponse>> GetMatchStatisticsAsync(long matchId);
    Task<List<MatchStatisticsResponse>> GetTeamMatchStatisticsAsync(long matchId, long teamId);
    Task<List<MatchStatisticsResponse>> GetPlayerTournamentStatisticsAsync(long tournamentId, long playerId);
    Task<List<MatchStatisticsResponse>> GetTopScorersByTournamentAsync(long tournamentId);
    Task<List<MatchStatisticsResponse>> GetTopAssistProvidersByTournamentAsync(long tournamentId);
    Task<List<TournamentStandingResponse>> GetTournamentStandingsAsync(long tournamentId);

    /// <summary>Aggregates statistics from match events to update player statistics — also called by MatchManagementService lifecycle transitions.</summary>
    Task AggregateMatchStatisticsAsync(long matchId);

    Task<long> GetTeamTotalGoalsInTournamentAsync(long tournamentId, long teamId);
    Task<int> GetPlayerTotalDisciplinaryCardsInTournamentAsync(long tournamentId, long playerId);
    Task<List<MatchStatisticsResponse>> GetTopCardReceiversByTournamentAsync(long tournamentId);
}
