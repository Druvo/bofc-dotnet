using BofcBackend.Api.Features.Statistics.Models;

namespace BofcBackend.Api.Features.Statistics;

public interface IPlayerStatisticsService
{
    Task<List<PlayerStatisticsResponse>> GetPlayerStatisticsAsync(PlayerStatisticsFilterRequest filter);
    Task<List<TournamentTopScorerResponse>> GetTopScorersByTournamentAsync(long tournamentId, int limit);
}
