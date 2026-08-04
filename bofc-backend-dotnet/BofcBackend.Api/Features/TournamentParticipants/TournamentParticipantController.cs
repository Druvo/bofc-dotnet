using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Features.TournamentParticipants.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.TournamentParticipants;

/// <summary>Port of controller/TournamentParticipantController.java. No endpoint here is
/// role-gated in Java — self/admin authorization for the write endpoint is enforced inside
/// the service instead.</summary>
[ApiController]
[Route("tournament-participants")]
[AllowAnonymous]
public class TournamentParticipantController(
    ITournamentParticipantService tournamentParticipantService,
    ITournamentParticipantPlayerService tournamentParticipantPlayerService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> SaveOrUpdateTournamentParticipant([FromBody] TournamentParticipantRequest request)
    {
        await tournamentParticipantService.SaveOrUpdateTournamentParticipantAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [HttpGet("{tournamentId}/next-upcoming")]
    public async Task<IActionResult> GetNextTournamentForParticipation(long tournamentId)
    {
        var response = await tournamentParticipantPlayerService.GetNextTournamentForParticipationAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("{tournamentId}/to-be-selected")]
    public async Task<IActionResult> PlayersToBeSelectedForTeam(long tournamentId)
    {
        var response = await tournamentParticipantService.PlayersToBeSelectedForTeamAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("{tournamentId}/goal-keepers")]
    public async Task<IActionResult> GetGoalkeeperStats(long tournamentId)
    {
        var response = await tournamentParticipantService.GoalkeeperStatsResponseAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("latest/with-participants")]
    public async Task<IActionResult> GetLatestTournamentWithParticipants()
    {
        var response = await tournamentParticipantService.GetLatestTournamentWithParticipantsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("latest/with-user-status")]
    public async Task<IActionResult> GetLatestTournamentWithUserStatus()
    {
        var response = await tournamentParticipantService.GetLatestTournamentWithUserStatusAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
