using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Prizes.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Prizes;

/// <summary>Port of controller/MatchDayPrizeController.java.</summary>
[ApiController]
[Route("match-days/{matchDayId}/prizes")]
public class MatchDayPrizeController(IMatchDayPrizeService prizeService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> CreatePrize(long matchDayId, [FromBody] MatchDayPrizeRequest request)
    {
        request.MatchDayId = matchDayId;
        var response = await prizeService.CreatePrizeAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, "Prize created successfully", response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{prizeId}")]
    public async Task<IActionResult> UpdatePrize(long matchDayId, long prizeId, [FromBody] MatchDayPrizeRequest request)
    {
        request.MatchDayId = matchDayId;
        var response = await prizeService.UpdatePrizeAsync(prizeId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prize updated successfully", response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{prizeId}")]
    public async Task<IActionResult> DeletePrize(long matchDayId, long prizeId)
    {
        await prizeService.DeletePrizeAsync(prizeId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prize deleted successfully");
    }

    [AllowAnonymous]
    [HttpGet("{prizeId}")]
    public async Task<IActionResult> GetPrizeById(long matchDayId, long prizeId)
    {
        var response = await prizeService.GetPrizeByIdAsync(prizeId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prize fetched successfully", response);
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllPrizes(long matchDayId)
    {
        var prizes = await prizeService.GetAllPrizesByMatchDayAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prizes fetched successfully", prizes);
    }

    [AllowAnonymous]
    [HttpGet("by-type")]
    public async Task<IActionResult> GetPrizesByType(long matchDayId, [FromQuery] PrizeType prizeType)
    {
        var prizes = await prizeService.GetPrizesByMatchDayAndTypeAsync(matchDayId, prizeType);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prizes fetched successfully", prizes);
    }

    [AllowAnonymous]
    [HttpGet("team/{teamId}")]
    public async Task<IActionResult> GetPrizesByTeam(long matchDayId, long teamId)
    {
        var prizes = await prizeService.GetPrizesByTeamAsync(matchDayId, teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Team prizes fetched successfully", prizes);
    }

    [AllowAnonymous]
    [HttpGet("player/{playerId}")]
    public async Task<IActionResult> GetPrizesByPlayer(long matchDayId, long playerId)
    {
        var prizes = await prizeService.GetPrizesByPlayerAsync(matchDayId, playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Player prizes fetched successfully", prizes);
    }
}
