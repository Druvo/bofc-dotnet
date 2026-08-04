using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Rounds.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Rounds;

/// <summary>Port of controller/RoundGroupController.java.</summary>
[ApiController]
[Route("groups")]
public class RoundGroupController(IRoundGroupService roundGroupService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] RoundGroupRequest request)
    {
        var response = await roundGroupService.CreateGroupAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{groupId}")]
    public async Task<IActionResult> UpdateGroup(long groupId, [FromBody] RoundGroupRequest request)
    {
        var response = await roundGroupService.UpdateGroupAsync(groupId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{groupId}")]
    public async Task<IActionResult> DeleteGroup(long groupId)
    {
        await roundGroupService.DeleteGroupAsync(groupId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Group deleted successfully");
    }

    [AllowAnonymous]
    [HttpGet("{groupId}")]
    public async Task<IActionResult> GetGroupById(long groupId)
    {
        var response = await roundGroupService.GetGroupByIdAsync(groupId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("round/{roundId}")]
    public async Task<IActionResult> GetGroupsByRoundId(long roundId)
    {
        var response = await roundGroupService.GetGroupsByRoundIdAsync(roundId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{groupId}/teams")]
    public async Task<IActionResult> AssignTeamsToGroup(long groupId, [FromBody] TeamAssignmentRequest request)
    {
        await roundGroupService.AssignTeamsToGroupAsync(groupId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Teams assigned successfully to group");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("placeholder")]
    public async Task<IActionResult> CreatePlaceholderTeam([FromBody] PlaceholderTeamRequest request)
    {
        await roundGroupService.CreatePlaceholderTeamAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, "Placeholder team created successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{groupId}/teams/{teamId}")]
    public async Task<IActionResult> RemoveTeamFromGroup(long groupId, long teamId)
    {
        await roundGroupService.RemoveTeamFromGroupAsync(groupId, teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Team removed successfully from group");
    }

    [AllowAnonymous]
    [HttpGet("{groupId}/standings")]
    public async Task<IActionResult> GetGroupStandings(long groupId)
    {
        var response = await roundGroupService.GetGroupStandingsAsync(groupId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{groupId}/standings/recalculate")]
    public async Task<IActionResult> RecalculateGroupStandings(long groupId)
    {
        await roundGroupService.RecalculateGroupStandingsAsync(groupId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Group standings recalculated successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{groupId}/standings/tiebreak")]
    public async Task<IActionResult> ApplyGroupTiebreak(long groupId, [FromBody] GroupTiebreakRequest request)
    {
        var response = await roundGroupService.ApplyGroupTiebreakAsync(groupId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Group tiebreak applied successfully", response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{groupId}/generate-matches")]
    public async Task<IActionResult> GenerateGroupMatches(long groupId, [FromBody] GroupMatchGenerationRequest request)
    {
        var matches = await roundGroupService.GenerateGroupMatchesAsync(groupId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, $"Generated {matches.Count} matches successfully", matches);
    }

    [AllowAnonymous]
    [HttpGet("{groupId}/matches")]
    public async Task<IActionResult> GetGroupMatches(long groupId)
    {
        var matches = await roundGroupService.GetGroupMatchesAsync(groupId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, matches);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{groupId}/matches")]
    public async Task<IActionResult> ClearGroupMatches(long groupId)
    {
        await roundGroupService.ClearGroupMatchesAsync(groupId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Group matches cleared successfully");
    }
}
