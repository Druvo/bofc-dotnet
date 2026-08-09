using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.SquadLineups.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.SquadLineups;

[ApiController]
[Route("teams/{teamId}/lineup")]
public class SquadLineupController(ISquadLineupService squadLineupService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetLineup(long teamId)
    {
        var response = await squadLineupService.GetLineupAsync(teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut]
    public async Task<IActionResult> UpdateLineup(long teamId, [FromBody] UpdateTeamLineupRequest request)
    {
        var response = await squadLineupService.UpdateLineupAsync(teamId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }
}
