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
    // Was [AllowAnonymous]: anyone on the internet could create a club member, who is then
    // issued the configured default password. Registration is an admin act - there is no
    // self-signup anywhere in the product.
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> RegisterPlayer([FromBody] PlayerRegistrationRequest request)
    {
        await playerService.RegisterPlayerAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    // Was [AllowAnonymous], which published every member's name, email address and mobile
    // number to anonymous callers - PlayerResponse carries all three. Any signed-in member may
    // still read it; the club's own roster is not a secret from the club.
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAllPlayers()
    {
        var players = await playerService.GetAllPlayersAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, players);
    }

    // Was [AllowAnonymous] - same personal contact details as the list above.
    [Authorize]
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

    /// <summary>Admin-only - Rank is never exposed via the anonymous-readable PlayerResponse endpoints above.</summary>
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpGet("{id}/rank")]
    public async Task<IActionResult> GetPlayerRank(long id)
    {
        var rank = await playerService.GetPlayerRankAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, rank);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}/rank")]
    public async Task<IActionResult> SetPlayerRank(long id, [FromBody] PlayerRankRequest request)
    {
        await playerService.SetPlayerRankAsync(id, request.Rank);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    /// <summary>Admin-only opt-out from goalkeeper auto-assignment - never exposed via the anonymous-readable PlayerResponse endpoints above.</summary>
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpGet("{id}/goalkeeper-rotation-exclusion")]
    public async Task<IActionResult> GetGoalkeeperRotationExclusion(long id)
    {
        var excluded = await playerService.GetGoalkeeperRotationExclusionAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, excluded);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}/goalkeeper-rotation-exclusion")]
    public async Task<IActionResult> SetGoalkeeperRotationExclusion(long id, [FromBody] GoalkeeperRotationExclusionRequest request)
    {
        await playerService.SetGoalkeeperRotationExclusionAsync(id, request.Excluded);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    /// <summary>Admin-only opt-in to always play goalkeeper - never exposed via the anonymous-readable PlayerResponse endpoints above.</summary>
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpGet("{id}/default-goalkeeper")]
    public async Task<IActionResult> GetDefaultGoalkeeper(long id)
    {
        var isDefault = await playerService.GetDefaultGoalkeeperAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, isDefault);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}/default-goalkeeper")]
    public async Task<IActionResult> SetDefaultGoalkeeper(long id, [FromBody] DefaultGoalkeeperRequest request)
    {
        await playerService.SetDefaultGoalkeeperAsync(id, request.IsDefault);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    /// <summary>Admin-only "temporarily away" flag - see Player.IsPaused. Never exposed via the
    /// anonymous-readable PlayerResponse endpoints above, same convention as Rank and the
    /// goalkeeper flags.</summary>
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpGet("{id}/paused")]
    public async Task<IActionResult> GetPaused(long id)
    {
        var paused = await playerService.GetPausedAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, paused);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}/paused")]
    public async Task<IActionResult> SetPaused(long id, [FromBody] PlayerPausedRequest request)
    {
        await playerService.SetPausedAsync(id, request.Paused);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    /// <summary>Feeds the admin drag-and-drop rank board - separate from the plain player list/edit page.</summary>
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpGet("ranks")]
    public async Task<IActionResult> GetPlayerRanks()
    {
        var ranks = await playerService.GetPlayerRanksAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, ranks);
    }

    // Was [AllowAnonymous] - PlayerService.UpdatePlayerAsync's self-or-admin check only ever
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

    /// <summary>Self-service only - always the caller's own row (no id param), so any authenticated player can set it, not just admins.</summary>
    [Authorize]
    [HttpPut("me/theme-preference")]
    public async Task<IActionResult> UpdateOwnThemePreference([FromBody] ThemePreferenceRequest request)
    {
        await playerService.UpdateOwnThemePreferenceAsync(request.ThemePreference);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    /// <summary>Self-service only - always the caller's own row (no id param), so any authenticated player can opt in/out of system emails without needing admin access.</summary>
    [Authorize]
    [HttpPut("me/email-notifications-enabled")]
    public async Task<IActionResult> UpdateOwnEmailNotificationsEnabled([FromBody] EmailNotificationsEnabledRequest request)
    {
        await playerService.UpdateOwnEmailNotificationsEnabledAsync(request.EmailNotificationsEnabled);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    [Authorize]
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

    // Mirrored GetPlayerMatchHistory (StatisticsController)'s [AllowAnonymous] openness,
    // since goalkeeping appearances are non-sensitive roster/history info like match history.
    // but that alignment is dropped: the public viewer reads the statistics endpoints and does
    // not touch this one, so there is nothing public relying on it.
    [Authorize]
    [HttpGet("{playerId}/goalkeeping-history")]
    public async Task<IActionResult> GetGoalKeeperHistoryForPlayer(long playerId)
    {
        var history = await playerService.GetGoalKeeperHistoryByPlayerIdAsync(playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, history);
    }

    // Mirrors GetGoalKeeperHistoryForPlayer - authenticated for the same reason, captaincy history
    // is non-sensitive roster info like match/goalkeeping history.
    [Authorize]
    [HttpGet("{playerId}/captain-history")]
    public async Task<IActionResult> GetCaptainHistoryForPlayer(long playerId)
    {
        var history = await playerService.GetCaptainHistoryByPlayerIdAsync(playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, history);
    }

    [Authorize]
    [HttpGet("goalkeeper-queue")]
    public async Task<IActionResult> GetGoalKeeperPriorityQueue([FromQuery] long matchDayId)
    {
        var response = await playerService.GetGoalKeeperPriorityQueueAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
