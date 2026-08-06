using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Rounds.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Rounds;

/// <summary>Port of controller/MatchDayRoundController.java.</summary>
[ApiController]
[Route("rounds")]
public class MatchDayRoundController(IMatchDayRoundService matchDayRoundService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> CreateRound([FromBody] MatchDayRoundRequest request)
    {
        var response = await matchDayRoundService.CreateRoundAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{roundId}")]
    public async Task<IActionResult> UpdateRound(long roundId, [FromBody] MatchDayRoundRequest request)
    {
        var response = await matchDayRoundService.UpdateRoundAsync(roundId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{roundId}")]
    public async Task<IActionResult> DeleteRound(long roundId)
    {
        await matchDayRoundService.DeleteRoundAsync(roundId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Round deleted successfully");
    }

    [AllowAnonymous]
    [HttpGet("{roundId}")]
    public async Task<IActionResult> GetRoundById(long roundId)
    {
        var response = await matchDayRoundService.GetRoundByIdAsync(roundId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("match-day/{matchDayId}")]
    public async Task<IActionResult> GetRoundsByMatchDayId(long matchDayId)
    {
        var response = await matchDayRoundService.GetRoundsByMatchDayIdAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("match-day/{matchDayId}/structure")]
    public async Task<IActionResult> GetMatchDayStructure(long matchDayId)
    {
        var response = await matchDayRoundService.GetMatchDayStructureAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{roundId}/start")]
    public async Task<IActionResult> StartRound(long roundId)
    {
        var response = await matchDayRoundService.StartRoundAsync(roundId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Round started successfully", response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("complete")]
    public async Task<IActionResult> CompleteRound([FromBody] RoundCompletionRequest request)
    {
        var response = await matchDayRoundService.CompleteRoundAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Round completed successfully", response);
    }

    [AllowAnonymous]
    [HttpGet("match-day/{matchDayId}/next")]
    public async Task<IActionResult> GetNextRound(long matchDayId, [FromQuery] int currentSequenceOrder)
    {
        var response = await matchDayRoundService.GetNextRoundAsync(matchDayId, currentSequenceOrder);
        return response == null
            ? ResponseBuilder.BuildSuccessResponse(HttpStatusCode.NotFound, "No next round found")
            : ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("match-day/{matchDayId}/previous")]
    public async Task<IActionResult> GetPreviousRound(long matchDayId, [FromQuery] int currentSequenceOrder)
    {
        var response = await matchDayRoundService.GetPreviousRoundAsync(matchDayId, currentSequenceOrder);
        return response == null
            ? ResponseBuilder.BuildSuccessResponse(HttpStatusCode.NotFound, "No previous round found")
            : ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{roundId}/teams")]
    public async Task<IActionResult> AssignTeamsToRound(long roundId, [FromBody] TeamAssignmentRequest request)
    {
        await matchDayRoundService.AssignTeamsToRoundAsync(roundId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Teams assigned to round successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{roundId}/teams/{teamId}")]
    public async Task<IActionResult> RemoveTeamFromRound(long roundId, long teamId)
    {
        await matchDayRoundService.RemoveTeamFromRoundAsync(roundId, teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Team removed from round successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{roundId}/matches/generate")]
    public async Task<IActionResult> GenerateRoundMatches(long roundId, [FromBody] RoundMatchGenerationRequest request)
    {
        var matches = await matchDayRoundService.GenerateRoundMatchesAsync(roundId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Matches generated successfully", matches);
    }
}
