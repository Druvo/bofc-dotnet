using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Rounds.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Rounds;

/// <summary>Port of controller/TournamentRoundController.java.</summary>
[ApiController]
[Route("rounds")]
public class TournamentRoundController(ITournamentRoundService tournamentRoundService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> CreateRound([FromBody] TournamentRoundRequest request)
    {
        var response = await tournamentRoundService.CreateRoundAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{roundId}")]
    public async Task<IActionResult> UpdateRound(long roundId, [FromBody] TournamentRoundRequest request)
    {
        var response = await tournamentRoundService.UpdateRoundAsync(roundId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{roundId}")]
    public async Task<IActionResult> DeleteRound(long roundId)
    {
        await tournamentRoundService.DeleteRoundAsync(roundId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Round deleted successfully");
    }

    [AllowAnonymous]
    [HttpGet("{roundId}")]
    public async Task<IActionResult> GetRoundById(long roundId)
    {
        var response = await tournamentRoundService.GetRoundByIdAsync(roundId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("tournament/{tournamentId}")]
    public async Task<IActionResult> GetRoundsByTournamentId(long tournamentId)
    {
        var response = await tournamentRoundService.GetRoundsByTournamentIdAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("tournament/{tournamentId}/structure")]
    public async Task<IActionResult> GetTournamentStructure(long tournamentId)
    {
        var response = await tournamentRoundService.GetTournamentStructureAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{roundId}/start")]
    public async Task<IActionResult> StartRound(long roundId)
    {
        var response = await tournamentRoundService.StartRoundAsync(roundId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Round started successfully", response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("complete")]
    public async Task<IActionResult> CompleteRound([FromBody] RoundCompletionRequest request)
    {
        var response = await tournamentRoundService.CompleteRoundAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Round completed successfully", response);
    }

    [AllowAnonymous]
    [HttpGet("tournament/{tournamentId}/next")]
    public async Task<IActionResult> GetNextRound(long tournamentId, [FromQuery] int currentSequenceOrder)
    {
        var response = await tournamentRoundService.GetNextRoundAsync(tournamentId, currentSequenceOrder);
        return response == null
            ? ResponseBuilder.BuildSuccessResponse(HttpStatusCode.NotFound, "No next round found")
            : ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("tournament/{tournamentId}/previous")]
    public async Task<IActionResult> GetPreviousRound(long tournamentId, [FromQuery] int currentSequenceOrder)
    {
        var response = await tournamentRoundService.GetPreviousRoundAsync(tournamentId, currentSequenceOrder);
        return response == null
            ? ResponseBuilder.BuildSuccessResponse(HttpStatusCode.NotFound, "No previous round found")
            : ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{roundId}/teams")]
    public async Task<IActionResult> AssignTeamsToRound(long roundId, [FromBody] TeamAssignmentRequest request)
    {
        await tournamentRoundService.AssignTeamsToRoundAsync(roundId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Teams assigned to round successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{roundId}/teams/{teamId}")]
    public async Task<IActionResult> RemoveTeamFromRound(long roundId, long teamId)
    {
        await tournamentRoundService.RemoveTeamFromRoundAsync(roundId, teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Team removed from round successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{roundId}/matches/generate")]
    public async Task<IActionResult> GenerateRoundMatches(long roundId, [FromBody] RoundMatchGenerationRequest request)
    {
        var matches = await tournamentRoundService.GenerateRoundMatchesAsync(roundId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Matches generated successfully", matches);
    }
}
