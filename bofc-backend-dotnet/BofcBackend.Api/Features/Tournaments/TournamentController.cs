using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Teams;
using BofcBackend.Api.Features.Tournaments.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace BofcBackend.Api.Features.Tournaments;

/// <summary>Port of controller/TournamentController.java.</summary>
[ApiController]
[Route("tournaments")]
public class TournamentController(ITournamentService tournamentService, ITeamService teamService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> SaveTournament([FromBody] TournamentRequest request)
    {
        var response = await tournamentService.SaveTournamentAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, response);
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllTournament([FromQuery] int offSet = 0, [FromQuery] int pageSize = 10,
        [FromQuery] string sortedBy = "id", [FromQuery] string sortDirection = "DESC",
        [FromQuery] string? searchColumn = null, [FromQuery] string? searchValue = null)
    {
        var response = await tournamentService.GetAllTournamentAsync(offSet, pageSize, sortedBy, sortDirection, searchColumn, searchValue);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTournamentById(long id)
    {
        var response = await tournamentService.GetTournamentByIdAsync(id);
        // Java returns HttpStatus.FOUND (302) here with a JSON body — unusual for a GET-by-id
        // but reproduced as-is since changing it is a behavior change, not a straight port.
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Found, RestResponseMessage.CreateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromQuery] bool active)
    {
        await tournamentService.UpdateTournamentStatusAsync(id, active);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.StatusUpdateOk);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{id}/conclude")]
    public async Task<IActionResult> ConcludeTournament(long id)
    {
        await tournamentService.ConcludeTournamentAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Tournament concluded successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTournament(long id, [FromBody] TournamentUpdateRequest request)
    {
        var response = await tournamentService.UpdateTournamentAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    [AllowAnonymous]
    [HttpGet("details")]
    public async Task<IActionResult> GetTournamentsSummery([FromQuery, BindRequired] long tournamentId)
    {
        var response = await teamService.GetTournamentsSummaryAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("most-recent")]
    public async Task<IActionResult> GetMostRecentTournament()
    {
        var response = await tournamentService.GetMostRecentTournamentAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    /// <summary>Id, name, and tournamentDate ordered by tournamentDate descending; optional 4-digit year filter.</summary>
    [AllowAnonymous]
    [HttpGet("list")]
    public async Task<IActionResult> GetTournamentList([FromQuery] string? year = null)
    {
        var response = await tournamentService.GetTournamentListAsync(year);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    /// <summary>Distinct years with tournaments, newest first.</summary>
    [AllowAnonymous]
    [HttpGet("sessions")]
    public async Task<IActionResult> GetTournamentSessions()
    {
        var response = await tournamentService.GetTournamentSessionsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
