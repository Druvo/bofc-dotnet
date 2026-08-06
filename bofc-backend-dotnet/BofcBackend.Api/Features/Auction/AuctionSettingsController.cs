using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of controller/auction/AuctionSettingsController.java — raw responses, no envelope.</summary>
[ApiController]
[Route("match-days/{matchDayId}/auction/settings")]
public class AuctionSettingsController(AuctionSettingsService auctionSettingsService) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetSettings(long matchDayId)
    {
        var settings = await auctionSettingsService.GetSettingsAsync(matchDayId);
        return settings == null ? NoContent() : Ok(settings);
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> CreateSettings(long matchDayId, [FromBody] AuctionSettingsRequest request) =>
        StatusCode(StatusCodes.Status201Created, await auctionSettingsService.CreateSettingsAsync(matchDayId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPut]
    public async Task<IActionResult> UpdateSettings(long matchDayId, [FromBody] AuctionSettingsRequest request) =>
        Ok(await auctionSettingsService.UpdateSettingsAsync(matchDayId, request));
}
