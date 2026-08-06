using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.LogicNodes.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.LogicNodes;

/// <summary>Port of controller/LogicNodeController.java.</summary>
[ApiController]
[Route("logic-nodes")]
public class LogicNodeController(ILogicNodeService logicNodeService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> CreateLogicNode([FromBody] LogicNodeRequest request)
    {
        var response = await logicNodeService.CreateLogicNodeAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{nodeId}")]
    public async Task<IActionResult> UpdateLogicNode(long nodeId, [FromBody] LogicNodeRequest request)
    {
        var response = await logicNodeService.UpdateLogicNodeAsync(nodeId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{nodeId}")]
    public async Task<IActionResult> DeleteLogicNode(long nodeId)
    {
        await logicNodeService.DeleteLogicNodeAsync(nodeId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Logic node deleted successfully");
    }

    [AllowAnonymous]
    [HttpGet("{nodeId}")]
    public async Task<IActionResult> GetLogicNodeById(long nodeId)
    {
        var response = await logicNodeService.GetLogicNodeByIdAsync(nodeId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
    [HttpGet("match-day/{matchDayId}")]
    public async Task<IActionResult> GetLogicNodesByMatchDay(long matchDayId)
    {
        var responses = await logicNodeService.GetLogicNodesByMatchDayAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, responses);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("{nodeId}/execute")]
    public async Task<IActionResult> ExecuteLogicNode(long nodeId)
    {
        var response = await logicNodeService.ExecuteLogicNodeAsync(nodeId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Logic node executed successfully", response);
    }
}
