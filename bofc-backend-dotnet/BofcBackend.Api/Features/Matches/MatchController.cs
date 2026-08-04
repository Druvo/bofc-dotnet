using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Matches.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Matches;

/// <summary>Port of controller/MatchController.java.</summary>
[ApiController]
[Route("matches")]
public class MatchController(IMatchManagementService matchManagementService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [AllowAnonymous]
    [HttpGet("{matchId}")]
    public async Task<IActionResult> GetMatchById(long matchId)
    {
        var match = await matchManagementService.GetMatchByIdAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match retrieved successfully", match);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{matchId}/start")]
    public async Task<IActionResult> StartMatch(long matchId)
    {
        var match = await matchManagementService.StartMatchAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match started successfully", match);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{matchId}/pause")]
    public async Task<IActionResult> PauseMatch(long matchId)
    {
        var match = await matchManagementService.PauseMatchAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match paused successfully", match);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{matchId}/resume")]
    public async Task<IActionResult> ResumeMatch(long matchId)
    {
        var match = await matchManagementService.ResumeMatchAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match resumed successfully", match);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{matchId}/complete")]
    public async Task<IActionResult> CompleteMatch(long matchId)
    {
        var match = await matchManagementService.CompleteMatchAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match completed successfully", match);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{matchId}")]
    public async Task<IActionResult> UpdateMatch(long matchId, [FromBody] MatchUpdateRequest request)
    {
        var match = await matchManagementService.UpdateMatchAsync(matchId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match updated successfully", match);
    }

    [AllowAnonymous]
    [HttpGet("{matchId}/events")]
    public async Task<IActionResult> GetMatchEvents(long matchId)
    {
        var events = await matchManagementService.GetMatchEventsAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match events retrieved successfully", events, events.Count);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("events")]
    public async Task<IActionResult> RecordMatchEvent([FromBody] MatchEventRequest request)
    {
        var ev = await matchManagementService.RecordMatchEventAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, "Match event recorded successfully", ev);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("events/{eventId}")]
    public async Task<IActionResult> UpdateMatchEvent(long eventId, [FromBody] MatchEventUpdateRequest request)
    {
        var ev = await matchManagementService.UpdateMatchEventAsync(eventId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match event updated successfully", ev);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{matchId}/elapsed-time")]
    public async Task<IActionResult> UpdateElapsedTime(long matchId, [FromQuery] int elapsedSeconds)
    {
        await matchManagementService.UpdateElapsedTimeAsync(matchId, elapsedSeconds);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Elapsed time updated successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{matchId}/score")]
    public async Task<IActionResult> UpdateTeamScore(long matchId, [FromQuery] long teamId, [FromQuery] int newScore)
    {
        await matchManagementService.UpdateTeamScoreAsync(matchId, teamId, newScore);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Team score updated successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("events/{eventId}")]
    public async Task<IActionResult> DeleteMatchEvent(long eventId)
    {
        await matchManagementService.DeleteMatchEventAsync(eventId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match event deleted successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> CreateMatch([FromBody] MatchCreateRequest request)
    {
        var match = await matchManagementService.CreateMatchAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, "Match created successfully", match);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{matchId}")]
    public async Task<IActionResult> DeleteMatch(long matchId)
    {
        await matchManagementService.DeleteMatchAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match deleted successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("order")]
    public async Task<IActionResult> UpdateMatchOrder([FromBody] MatchOrderUpdateRequest request)
    {
        await matchManagementService.UpdateMatchOrderAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match order updated successfully");
    }
}
