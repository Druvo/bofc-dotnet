using BofcBackend.Api.Features.Matches.Models;
using BofcBackend.Api.Features.Rounds.Models;

namespace BofcBackend.Api.Features.Rounds;

/// <summary>Port of service/RoundGroupService.java.</summary>
public interface IRoundGroupService
{
    Task<RoundGroupResponse> CreateGroupAsync(RoundGroupRequest request);
    Task<RoundGroupResponse> UpdateGroupAsync(long groupId, RoundGroupRequest request);
    Task DeleteGroupAsync(long groupId);
    Task<RoundGroupResponse> GetGroupByIdAsync(long groupId);
    Task<List<RoundGroupResponse>> GetGroupsByRoundIdAsync(long roundId);
    Task AssignTeamsToGroupAsync(long groupId, TeamAssignmentRequest request);
    Task CreatePlaceholderTeamAsync(PlaceholderTeamRequest request);
    Task RemoveTeamFromGroupAsync(long groupId, long teamId);
    Task<List<GroupStandingResponse>> GetGroupStandingsAsync(long groupId);

    Task RecalculateGroupStandingsAsync(long groupId);

    /// <summary>Records a manual penalty-shootout tiebreak for teams level on every other criterion, then re-ranks the group.</summary>
    Task<List<GroupStandingResponse>> ApplyGroupTiebreakAsync(long groupId, GroupTiebreakRequest request);

    Task<List<MatchResponse>> GenerateGroupMatchesAsync(long groupId, GroupMatchGenerationRequest request);
    Task<List<MatchResponse>> GetGroupMatchesAsync(long groupId);
    Task ClearGroupMatchesAsync(long groupId);
}
