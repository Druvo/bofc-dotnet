using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Statistics.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Statistics;

/// <summary>Port of controller/PlayerStatisticsController.java. No class-level [AllowAnonymous] —
/// the two read endpoints below opt in individually so the admin-only adjustment endpoints
/// further down stay behind [Authorize] (AllowAnonymous on either the controller or the action
/// overrides Authorize wherever it appears, so it can't sit at the class level here).</summary>
[ApiController]
[Route("player-statistics")]
public class PlayerStatisticsController(IPlayerStatisticsService playerStatisticsService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetPlayerStatistics(
        [FromQuery] long? matchDayId,
        [FromQuery] bool weeklyMatchDaysOnly = false,
        [FromQuery] FootballPosition? position = null,
        [FromQuery] string sortBy = "goalsAssists",
        [FromQuery] string sortOrder = "DESC",
        [FromQuery] int limit = 100,
        [FromQuery] int offset = 0)
    {
        var filter = new PlayerStatisticsFilterRequest
        {
            MatchDayId = matchDayId,
            WeeklyMatchDaysOnly = weeklyMatchDaysOnly,
            Position = position,
            SortBy = sortBy,
            SortOrder = sortOrder,
            Limit = limit,
            Offset = offset,
        };

        var response = await playerStatisticsService.GetPlayerStatisticsAsync(filter);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("match-day/{matchDayId}/top-scorers")]
    public async Task<IActionResult> GetTopScorersByMatchDay(long matchDayId, [FromQuery] int limit = 1)
    {
        var response = await playerStatisticsService.GetTopScorersByMatchDayAsync(matchDayId, limit);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    /// <summary>Admin-only manual correction on top of match-derived stats — see PlayerStatAdjustment.</summary>
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpGet("{playerId}/adjustment")]
    public async Task<IActionResult> GetPlayerStatAdjustment(long playerId)
    {
        var response = await playerStatisticsService.GetPlayerStatAdjustmentAsync(playerId, null);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{playerId}/adjustment")]
    public async Task<IActionResult> UpdatePlayerStatAdjustment(long playerId, [FromBody] UpdatePlayerStatAdjustmentRequest request)
    {
        var response = await playerStatisticsService.UpdatePlayerStatAdjustmentAsync(playerId, null, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }
}
