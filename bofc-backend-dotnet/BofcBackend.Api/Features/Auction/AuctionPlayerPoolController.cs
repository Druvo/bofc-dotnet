using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of controller/auction/AuctionPlayerPoolController.java - raw responses, no envelope (see AuctionSessionController.cs).</summary>
[ApiController]
[Route("match-days/{matchDayId}/auction/players")]
public class AuctionPlayerPoolController(AuctionPlayerPoolService playerPoolService) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetPlayerPool(long matchDayId) => Ok(await playerPoolService.GetPlayerPoolAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("add-existing")]
    public async Task<IActionResult> AddExistingPlayer(long matchDayId, [FromBody] AuctionPlayerRequest request) =>
        StatusCode(StatusCodes.Status201Created, await playerPoolService.AddExistingPlayerAsync(matchDayId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("add-from-registration/{registrationId}")]
    public async Task<IActionResult> AddFromRegistration(long matchDayId, long registrationId, [FromBody] AuctionPlayerRequest request) =>
        StatusCode(StatusCodes.Status201Created, await playerPoolService.AddFromRegistrationAsync(matchDayId, registrationId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPut("{auctionPlayerId}")]
    public async Task<IActionResult> UpdatePlayer(long matchDayId, long auctionPlayerId, [FromBody] AuctionPlayerRequest request) =>
        Ok(await playerPoolService.UpdatePlayerAsync(matchDayId, auctionPlayerId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpDelete("{auctionPlayerId}")]
    public async Task<IActionResult> RemovePlayer(long matchDayId, long auctionPlayerId)
    {
        await playerPoolService.RemovePlayerAsync(matchDayId, auctionPlayerId);
        return NoContent();
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("{auctionPlayerId}/restore")]
    public async Task<IActionResult> RestorePlayer(long matchDayId, long auctionPlayerId) =>
        Ok(await playerPoolService.RestorePlayerAsync(matchDayId, auctionPlayerId));
}
