using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Players.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Players;

/// <summary>Port of controller/RoleController.java.</summary>
[ApiController]
[Route("roles")]
public class RoleController(IRoleService roleService) : ControllerBase
{
    [Authorize(Roles = PlayerRoleNames.SuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] RoleRequest request)
    {
        var response = await roleService.CreateRoleAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, response);
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAllRoles()
    {
        var roles = await roleService.GetAllRolesAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, roles);
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoleById(long id)
    {
        var response = await roleService.GetRoleByIdAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [Authorize(Roles = PlayerRoleNames.SuperAdmin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(long id)
    {
        await roleService.DeleteRoleAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }

    [Authorize(Roles = PlayerRoleNames.SuperAdmin)]
    [HttpPut("assign")]
    public async Task<IActionResult> AssignPlayerRoles([FromBody] PlayerRoleAssignmentRequest request)
    {
        var responses = await roleService.BatchAssignRolesToPlayersAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, responses);
    }

    [Authorize(Roles = PlayerRoleNames.SuperAdmin)]
    [HttpGet("players/all-with-roles")]
    public async Task<IActionResult> GetAllPlayersWithRoles()
    {
        var players = await roleService.GetAllPlayersWithRolesAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, players);
    }

    [Authorize(Roles = PlayerRoleNames.SuperAdmin)]
    [HttpGet("players/{playerId}/with-roles")]
    public async Task<IActionResult> GetPlayerWithRoles(long playerId)
    {
        var response = await roleService.GetPlayerWithRolesAsync(playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }
}
