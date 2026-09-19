using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Features.MatchDayParticipants.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.MatchDayParticipants;

/// <summary>Port of controller/MatchDayParticipantController.java. No endpoint here is
/// role-gated in Java - self/admin authorization for the write endpoint is enforced inside
/// the service instead.
///
/// The [AllowAnonymous] that used to sit on this class opened every action, the RSVP write
/// included. That write was never actually reachable anonymously - the service checks
/// IsUserAuthorizedForSelf and the admin roles, so a caller with no identity got a 403 - but
/// it left the only thing standing between "anyone may RSVP as anyone" and the database as a
/// check several call-levels away, with the attribute above saying the opposite. The opt-out
/// now sits on the single action the public match-day viewer actually reads.</summary>
[ApiController]
[Route("match-day-participants")]
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

    // Public: the match-day viewer's squad list. Carries names, photos and RSVP status -
    // deliberately no email or mobile number (see PlayerParticipationResponse).
    [AllowAnonymous]
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
