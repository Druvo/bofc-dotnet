using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of controller/auction/AuctionPlayerPoolController.java — raw responses, no envelope (see AuctionSessionController.cs).</summary>
[ApiController]
[Route("tournaments/{tournamentId}/auction/players")]
public class AuctionPlayerPoolController(AuctionPlayerPoolService playerPoolService) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetPlayerPool(long tournamentId) => Ok(await playerPoolService.GetPlayerPoolAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("add-existing")]
    public async Task<IActionResult> AddExistingPlayer(long tournamentId, [FromBody] AuctionPlayerRequest request) =>
        StatusCode(StatusCodes.Status201Created, await playerPoolService.AddExistingPlayerAsync(tournamentId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("add-from-registration/{registrationId}")]
    public async Task<IActionResult> AddFromRegistration(long tournamentId, long registrationId, [FromBody] AuctionPlayerRequest request) =>
        StatusCode(StatusCodes.Status201Created, await playerPoolService.AddFromRegistrationAsync(tournamentId, registrationId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPut("{auctionPlayerId}")]
    public async Task<IActionResult> UpdatePlayer(long tournamentId, long auctionPlayerId, [FromBody] AuctionPlayerRequest request) =>
        Ok(await playerPoolService.UpdatePlayerAsync(tournamentId, auctionPlayerId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpDelete("{auctionPlayerId}")]
    public async Task<IActionResult> RemovePlayer(long tournamentId, long auctionPlayerId)
    {
        await playerPoolService.RemovePlayerAsync(tournamentId, auctionPlayerId);
        return NoContent();
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("{auctionPlayerId}/restore")]
    public async Task<IActionResult> RestorePlayer(long tournamentId, long auctionPlayerId) =>
        Ok(await playerPoolService.RestorePlayerAsync(tournamentId, auctionPlayerId));
}
