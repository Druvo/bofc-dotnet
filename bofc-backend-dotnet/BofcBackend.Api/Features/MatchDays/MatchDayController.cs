using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Teams;
using BofcBackend.Api.Features.MatchDays.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace BofcBackend.Api.Features.MatchDays;

/// <summary>Port of controller/MatchDayController.java.</summary>
[ApiController]
[Route("match-days")]
public class MatchDayController(IMatchDayService matchDayService, ITeamService teamService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> SaveMatchDay([FromBody] MatchDayRequest request)
    {
        var response = await matchDayService.SaveMatchDayAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, response);
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllMatchDay([FromQuery] int offSet = 0, [FromQuery] int pageSize = 10,
        [FromQuery] string sortedBy = "id", [FromQuery] string sortDirection = "DESC",
        [FromQuery] string? searchColumn = null, [FromQuery] string? searchValue = null)
    {
        var response = await matchDayService.GetAllMatchDayAsync(offSet, pageSize, sortedBy, sortDirection, searchColumn, searchValue);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMatchDayById(long id)
    {
        var response = await matchDayService.GetMatchDayByIdAsync(id);
        // Java returns HttpStatus.FOUND (302) here with a JSON body - unusual for a GET-by-id
        // but reproduced as-is since changing it is a behavior change, not a straight port.
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Found, RestResponseMessage.CreateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromQuery] bool active)
    {
        await matchDayService.UpdateMatchDayStatusAsync(id, active);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.StatusUpdateOk);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{id}/conclude")]
    public async Task<IActionResult> ConcludeMatchDay(long id)
    {
        await matchDayService.ConcludeMatchDayAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "MatchDay concluded successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMatchDay(long id, [FromBody] MatchDayUpdateRequest request)
    {
        var response = await matchDayService.UpdateMatchDayAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    /// <summary>Permanently deletes the MatchDay and everything under it (fixtures, teams,
    /// lineups, rounds/groups, auction data, prizes, participants) - cannot be undone. Restricted
    /// to SuperAdmin, unlike every other MatchDay action here, given the blast radius.</summary>
    [Authorize(Roles = PlayerRoleNames.SuperAdmin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> HardDeleteMatchDay(long id)
    {
        await matchDayService.HardDeleteMatchDayAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "MatchDay permanently deleted");
    }

    [AllowAnonymous]
    [HttpGet("details")]
    public async Task<IActionResult> GetMatchDaysSummery([FromQuery, BindRequired] long matchDayId)
    {
        var response = await teamService.GetMatchDaysSummaryAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("most-recent")]
    public async Task<IActionResult> GetMostRecentMatchDay()
    {
        var response = await matchDayService.GetMostRecentMatchDayAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    /// <summary>The next non-concluded match - ONGOING (not stale) first, then soonest UPCOMING. Same pick as the Dashboard's "Next Match" card. Content is null when nothing qualifies.</summary>
    [AllowAnonymous]
    [HttpGet("next-active")]
    public async Task<IActionResult> GetNextActiveMatchDay()
    {
        var response = await matchDayService.GetMostRecentActiveMatchDayAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    /// <summary>The current/upcoming auto-created "Match Day" - content is null (not a 404) when the scheduler hasn't created one yet.</summary>
    [AllowAnonymous]
    [HttpGet("current-match-day")]
    public async Task<IActionResult> GetCurrentMatchDay()
    {
        var response = await matchDayService.GetCurrentMatchDayAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    /// <summary>Id, name, and matchDayDate ordered by matchDayDate descending; optional 4-digit year filter.</summary>
    [AllowAnonymous]
    [HttpGet("list")]
    public async Task<IActionResult> GetMatchDayList([FromQuery] string? year = null)
    {
        var response = await matchDayService.GetMatchDayListAsync(year);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    /// <summary>Distinct years with MatchDays, newest first.</summary>
    [AllowAnonymous]
    [HttpGet("sessions")]
    public async Task<IActionResult> GetMatchDaySessions()
    {
        var response = await matchDayService.GetMatchDaySessionsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
