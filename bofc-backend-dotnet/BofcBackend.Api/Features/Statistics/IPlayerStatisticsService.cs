using BofcBackend.Api.Features.Statistics.Models;

namespace BofcBackend.Api.Features.Statistics;

public interface IPlayerStatisticsService
{
    Task<List<PlayerStatisticsResponse>> GetPlayerStatisticsAsync(PlayerStatisticsFilterRequest filter);
    Task<List<MatchDayTopScorerResponse>> GetTopScorersByMatchDayAsync(long matchDayId, int limit);

    /// <summary>Admin-only manual correction on top of match-derived stats - see PlayerStatAdjustment.
    /// matchId null = the player's lifetime/overall adjustment; non-null = scoped to that one Match.</summary>
    Task<PlayerStatAdjustmentResponse> GetPlayerStatAdjustmentAsync(long playerId, long? matchId);
    Task<PlayerStatAdjustmentResponse> UpdatePlayerStatAdjustmentAsync(long playerId, long? matchId, UpdatePlayerStatAdjustmentRequest request);
}
