using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Scheduling;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Teams.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Teams;

/// <summary>Port of controller/MatchDayManagementController.java (route "/teams").</summary>
[ApiController]
[Route("teams")]
[Authorize(Roles = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator)]
public class TeamController(ITeamService teamService, WeeklyMatchDayTeamGenerator weeklyMatchDayTeamGenerator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateOrUpdateTeam([FromBody] TeamRequest request)
    {
        var response = await teamService.CreateOrUpdateTeamAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpDelete("{teamId}")]
    public async Task<IActionResult> DeleteTeam(long teamId)
    {
        await teamService.DeleteTeamAsync(teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }

    [HttpPost("players")]
    public async Task<IActionResult> SaveOrUpdateTeamPlayer([FromBody] TeamPlayerRequest request)
    {
        var response = await teamService.SaveOrUpdateTeamPlayerAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpPut("players")]
    public async Task<IActionResult> UpdateTeamPlayerDetails([FromBody] TeamPlayerRequest request)
    {
        var response = await teamService.UpdateTeamPlayerDetailsAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpDelete("players")]
    public async Task<IActionResult> RemovePlayerFromTeam([FromBody] TeamPlayerRemoveRequest request)
    {
        await teamService.RemovePlayerFromTeamAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }

    /// <summary>Manual on-demand rank-based team draft from the Team Building page — same
    /// snake-draft-by-rank logic the weekly scheduler uses (WeeklyMatchDayTeamGenerator), just
    /// admin-triggered for any MatchDay with an explicit max-players-per-team cap instead of the
    /// weekly scheduler's global Settings default. The number of teams is derived from confirmed
    /// participant turnout, not chosen directly. Refuses if the MatchDay already has any teams
    /// (manual or auto) — same all-or-nothing rule GenerateAsync already enforces.</summary>
    [HttpPost("matchday/{matchDayId}/generate")]
    public async Task<IActionResult> GenerateTeamsByRank(long matchDayId, [FromQuery] int maxPlayersPerTeam)
    {
        var result = await weeklyMatchDayTeamGenerator.GenerateAsync(matchDayId, maxPlayersPerTeam);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, result);
    }
}
