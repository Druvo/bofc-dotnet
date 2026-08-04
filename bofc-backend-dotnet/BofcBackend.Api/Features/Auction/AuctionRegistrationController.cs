using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of controller/auction/AuctionRegistrationController.java — raw responses, no envelope.</summary>
[ApiController]
[Route("auction")]
public class AuctionRegistrationController(AuctionRegistrationService registrationService) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;

    [AllowAnonymous]
    [HttpPost("tournaments/{tournamentId}/register")]
    public async Task<IActionResult> Register(long tournamentId, [FromBody] AuctionRegistrationRequest request)
    {
        request.TournamentId = tournamentId;
        return StatusCode(StatusCodes.Status201Created, await registrationService.RegisterAsync(request));
    }

    [Authorize]
    [HttpPost("tournaments/{tournamentId}/quick-register")]
    public async Task<IActionResult> QuickRegister(long tournamentId) =>
        StatusCode(StatusCodes.Status201Created, await registrationService.QuickRegisterExistingPlayerAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpGet("registrations")]
    public async Task<IActionResult> GetRegistrations([FromQuery] long? tournamentId, [FromQuery] string? status) =>
        Ok(await registrationService.GetRegistrationsAsync(tournamentId, status));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpGet("registrations/{id}")]
    public async Task<IActionResult> GetRegistration(long id) => Ok(await registrationService.GetRegistrationAsync(id));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("registrations/{id}/approve")]
    public async Task<IActionResult> Approve(long id) => Ok(await registrationService.ApproveAsync(id));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("registrations/{id}/approve-and-pool")]
    public async Task<IActionResult> ApproveAndAddToPool(long id, [FromBody] ApproveAndPoolRequest request) =>
        Ok(await registrationService.ApproveAndAddToPoolAsync(id, request.Category, request.BasePrice));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("registrations/{id}/reject")]
    public async Task<IActionResult> Reject(long id, [FromBody] Dictionary<string, string> body) =>
        Ok(await registrationService.RejectAsync(id, body.GetValueOrDefault("reason")));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("registrations/{id}/undo-reject")]
    public async Task<IActionResult> UndoReject(long id) => Ok(await registrationService.UndoRejectAsync(id));
}
