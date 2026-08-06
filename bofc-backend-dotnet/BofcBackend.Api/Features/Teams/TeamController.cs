using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Teams.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Teams;

/// <summary>Port of controller/MatchDayManagementController.java (route "/teams").</summary>
[ApiController]
[Route("teams")]
[Authorize(Roles = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator)]
public class TeamController(ITeamService teamService) : ControllerBase
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
}
