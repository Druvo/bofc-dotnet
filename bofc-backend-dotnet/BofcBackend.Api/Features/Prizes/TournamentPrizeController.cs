using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Prizes.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Prizes;

/// <summary>Port of controller/TournamentPrizeController.java.</summary>
[ApiController]
[Route("tournaments/{tournamentId}/prizes")]
public class TournamentPrizeController(ITournamentPrizeService prizeService) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost]
    public async Task<IActionResult> CreatePrize(long tournamentId, [FromBody] TournamentPrizeRequest request)
    {
        request.TournamentId = tournamentId;
        var response = await prizeService.CreatePrizeAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, "Prize created successfully", response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{prizeId}")]
    public async Task<IActionResult> UpdatePrize(long tournamentId, long prizeId, [FromBody] TournamentPrizeRequest request)
    {
        request.TournamentId = tournamentId;
        var response = await prizeService.UpdatePrizeAsync(prizeId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prize updated successfully", response);
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("{prizeId}")]
    public async Task<IActionResult> DeletePrize(long tournamentId, long prizeId)
    {
        await prizeService.DeletePrizeAsync(prizeId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prize deleted successfully");
    }

    [AllowAnonymous]
    [HttpGet("{prizeId}")]
    public async Task<IActionResult> GetPrizeById(long tournamentId, long prizeId)
    {
        var response = await prizeService.GetPrizeByIdAsync(prizeId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prize fetched successfully", response);
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllPrizes(long tournamentId)
    {
        var prizes = await prizeService.GetAllPrizesByTournamentAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prizes fetched successfully", prizes);
    }

    [AllowAnonymous]
    [HttpGet("by-type")]
    public async Task<IActionResult> GetPrizesByType(long tournamentId, [FromQuery] PrizeType prizeType)
    {
        var prizes = await prizeService.GetPrizesByTournamentAndTypeAsync(tournamentId, prizeType);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Prizes fetched successfully", prizes);
    }

    [AllowAnonymous]
    [HttpGet("team/{teamId}")]
    public async Task<IActionResult> GetPrizesByTeam(long tournamentId, long teamId)
    {
        var prizes = await prizeService.GetPrizesByTeamAsync(tournamentId, teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Team prizes fetched successfully", prizes);
    }

    [AllowAnonymous]
    [HttpGet("player/{playerId}")]
    public async Task<IActionResult> GetPrizesByPlayer(long tournamentId, long playerId)
    {
        var prizes = await prizeService.GetPrizesByPlayerAsync(tournamentId, playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Player prizes fetched successfully", prizes);
    }
}
