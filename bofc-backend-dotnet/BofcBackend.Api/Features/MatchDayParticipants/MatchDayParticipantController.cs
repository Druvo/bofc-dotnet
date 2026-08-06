using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Features.MatchDayParticipants.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.MatchDayParticipants;

/// <summary>Port of controller/MatchDayParticipantController.java. No endpoint here is
/// role-gated in Java — self/admin authorization for the write endpoint is enforced inside
/// the service instead.</summary>
[ApiController]
[Route("match-day-participants")]
[AllowAnonymous]
public class MatchDayParticipantController(
    IMatchDayParticipantService matchDayParticipantService,
    IMatchDayParticipantPlayerService matchDayParticipantPlayerService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> SaveOrUpdateMatchDayParticipant([FromBody] MatchDayParticipantRequest request)
    {
        await matchDayParticipantService.SaveOrUpdateMatchDayParticipantAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [HttpGet("{matchDayId}/next-upcoming")]
    public async Task<IActionResult> GetNextMatchDayForParticipation(long matchDayId)
    {
        var response = await matchDayParticipantPlayerService.GetNextMatchDayForParticipationAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("{matchDayId}/to-be-selected")]
    public async Task<IActionResult> PlayersToBeSelectedForTeam(long matchDayId)
    {
        var response = await matchDayParticipantService.PlayersToBeSelectedForTeamAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("{matchDayId}/goal-keepers")]
    public async Task<IActionResult> GetGoalkeeperStats(long matchDayId)
    {
        var response = await matchDayParticipantService.GoalkeeperStatsResponseAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("latest/with-participants")]
    public async Task<IActionResult> GetLatestMatchDayWithParticipants()
    {
        var response = await matchDayParticipantService.GetLatestMatchDayWithParticipantsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("latest/with-user-status")]
    public async Task<IActionResult> GetLatestMatchDayWithUserStatus()
    {
        var response = await matchDayParticipantService.GetLatestMatchDayWithUserStatusAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
