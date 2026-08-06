using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Statistics.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Statistics;

/// <summary>Port of controller/PlayerStatisticsController.java.</summary>
[ApiController]
[Route("player-statistics")]
[AllowAnonymous]
public class PlayerStatisticsController(IPlayerStatisticsService playerStatisticsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPlayerStatistics(
        [FromQuery] long? tournamentId,
        [FromQuery] bool weeklyMatchDaysOnly = false,
        [FromQuery] FootballPosition? position = null,
        [FromQuery] string sortBy = "goalsAssists",
        [FromQuery] string sortOrder = "DESC",
        [FromQuery] int limit = 100,
        [FromQuery] int offset = 0)
    {
        var filter = new PlayerStatisticsFilterRequest
        {
            TournamentId = tournamentId,
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

    [HttpGet("tournament/{tournamentId}/top-scorers")]
    public async Task<IActionResult> GetTopScorersByTournament(long tournamentId, [FromQuery] int limit = 1)
    {
        var response = await playerStatisticsService.GetTopScorersByTournamentAsync(tournamentId, limit);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
