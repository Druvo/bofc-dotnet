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

    /// <summary>One captain per team, drawn at random from the club's senior pool. Fills only
    /// empty posts - an existing captain is never replaced.</summary>
    Task<CaptainAutoAssignResponse> AutoAssignCaptainsAsync(long matchDayId);

    /// <summary>Emails every confirmed participant of this MatchDay that teams/fixtures are ready,
    /// with a link to the live Team Building page - the "Send Teams Email" button on Team
    /// Building, manually triggered (never automatic). Returns how many emails actually sent.</summary>
    Task<DeclareTeamsResult> DeclareTeamsAsync(long matchDayId, DeclareTeamsRequest request);
    Task<int> SendMatchDayReminderNowAsync(long matchDayId);
}
