using BofcBackend.Api.Features.Teams.Models;

namespace BofcBackend.Api.Features.Teams;

/// <summary>Port of service/TeamManagementService.java.</summary>
public interface ITeamService
{
    Task<TeamResponse> CreateOrUpdateTeamAsync(TeamRequest request);
    Task DeleteTeamAsync(long teamId);
    Task<TeamPlayerResponse> SaveOrUpdateTeamPlayerAsync(TeamPlayerRequest request);
    Task<TeamPlayerResponse> UpdateTeamPlayerDetailsAsync(TeamPlayerRequest request);
    Task RemovePlayerFromTeamAsync(TeamPlayerRemoveRequest request);
    Task<List<MatchDayWithTeamsResponse>> GetMatchDaysSummaryAsync(long? matchDayId);
    Task<GoalkeeperAutoAssignResponse> AutoAssignGoalkeepersAsync(long matchDayId);
    Task<GoalkeeperRankingResponse> GetGoalkeeperRankingAsync(long matchDayId);
    Task<ClearGoalkeepersResponse> ClearGoalkeepersAsync(long matchDayId);
}
