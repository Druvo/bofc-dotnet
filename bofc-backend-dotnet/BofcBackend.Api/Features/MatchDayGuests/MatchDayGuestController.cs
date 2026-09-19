using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.MatchDayGuests.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.MatchDayGuests;

/// <summary>Guest players on the Team Building page - see
/// <see cref="Domain.Entities.MatchDayGuest"/>. Writes are gated to the same roles that may
/// manage teams at all; the read is open for the same reason the squad list
/// (match-day-participants/{id}/to-be-selected) is - it carries nothing but names that are
/// already on the public team sheet.</summary>
[ApiController]
[Route("match-day-guests")]
[Authorize(Roles = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator)]
public class MatchDayGuestController(IMatchDayGuestService matchDayGuestService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("matchday/{matchDayId}")]
    public async Task<IActionResult> GetGuests(long matchDayId)
    {
        var response = await matchDayGuestService.GetGuestsAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpPost]
    public async Task<IActionResult> AddGuest([FromBody] MatchDayGuestRequest request)
    {
        var response = await matchDayGuestService.AddGuestAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, response);
    }

    /// <summary>Drag-and-drop between the Unassigned Pool and a team card. A null teamId in
    /// the body puts the guest back in the pool.</summary>
    [HttpPut("{guestId}/team")]
    public async Task<IActionResult> AssignGuestToTeam(long guestId, [FromBody] MatchDayGuestTeamRequest request)
    {
        var response = await matchDayGuestService.AssignGuestToTeamAsync(guestId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    [HttpDelete("{guestId}")]
    public async Task<IActionResult> RemoveGuest(long guestId)
    {
        await matchDayGuestService.RemoveGuestAsync(guestId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }
}
