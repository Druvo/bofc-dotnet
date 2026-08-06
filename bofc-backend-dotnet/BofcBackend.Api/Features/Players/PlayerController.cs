using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Players.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Players;

/// <summary>Port of controller/PlayerController.java.</summary>
[ApiController]
[Route("players")]
public class PlayerController(IPlayerService playerService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> RegisterPlayer([FromBody] PlayerRegistrationRequest request)
    {
        await playerService.RegisterPlayerAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllPlayers()
    {
        var players = await playerService.GetAllPlayersAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, players);
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlayerById(long id)
    {
        var player = await playerService.GetPlayerByIdAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, player);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdatePlayerStatus(long id, [FromQuery] bool active)
    {
        await playerService.UpdatePlayerStatusAsync(id, active);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.StatusUpdateOk);
    }

    // Was [AllowAnonymous] — PlayerService.UpdatePlayerAsync's self-or-admin check only ever
    // blocked anonymous callers as a side effect of GetPlayerId() throwing on a missing claim,
    // not because this endpoint declared it needs authentication. Explicit [Authorize] now
    // fails safely at the boundary regardless of how that internal check evolves.
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlayer(long id, [FromBody] PlayerUpdateRequest request)
    {
        var response = await playerService.UpdatePlayerAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    /// <summary>Self-service only — always the caller's own row (no id param), so any authenticated player can set it, not just admins.</summary>
    [Authorize]
    [HttpPut("me/theme-preference")]
    public async Task<IActionResult> UpdateOwnThemePreference([FromBody] ThemePreferenceRequest request)
    {
        await playerService.UpdateOwnThemePreferenceAsync(request.ThemePreference);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    [AllowAnonymous]
    [HttpGet("goal-keeper-history")]
    public async Task<IActionResult> GoalKeepingHistory()
    {
        var history = await playerService.GoalKeepingHistoryAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, history);
    }

    [Authorize]
    [HttpGet("goalkeeping-history")]
    public async Task<IActionResult> GetGoalKeeperHistoryForLoggedInUser()
    {
        var history = await playerService.GetGoalKeeperHistoryByLoggedInUserAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, history);
    }

    // Mirrors GetPlayerMatchHistory (StatisticsController) — same [AllowAnonymous] openness,
    // since goalkeeping appearances are non-sensitive roster/history info like match history.
    [AllowAnonymous]
    [HttpGet("{playerId}/goalkeeping-history")]
    public async Task<IActionResult> GetGoalKeeperHistoryForPlayer(long playerId)
    {
        var history = await playerService.GetGoalKeeperHistoryByPlayerIdAsync(playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, history);
    }

    [AllowAnonymous]
    [HttpGet("goalkeeper-queue")]
    public async Task<IActionResult> GetGoalKeeperPriorityQueue([FromQuery] long tournamentId)
    {
        var response = await playerService.GetGoalKeeperPriorityQueueAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
