using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Auction;

/// <summary>
/// Port of controller/auction/AuctionSessionController.java. Unlike the rest of the app, every
/// action here returns the DTO directly (Ok(x)), NOT the usual {message,statusCode,content}
/// envelope - Java's controller returns raw ResponseEntity&lt;T&gt; throughout, and the frontend's
/// auction slice reads the response body as the DTO itself, not response.data.content.
/// </summary>
[ApiController]
[Route("match-days/{matchDayId}/auction")]
public class AuctionSessionController(AuctionSessionService sessionService, ICurrentUserService currentUserService) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;
    private const string BidderRoles = PlayerRoleNames.TeamOwner + "," + PlayerRoleNames.Player + "," + PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin;

    [AllowAnonymous]
    [HttpGet("session")]
    public async Task<IActionResult> GetSession(long matchDayId) => Ok(await sessionService.GetSessionAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/start")]
    public async Task<IActionResult> StartAuction(long matchDayId) => Ok(await sessionService.StartAuctionAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/pause")]
    public async Task<IActionResult> PauseAuction(long matchDayId) => Ok(await sessionService.PauseAuctionAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/resume")]
    public async Task<IActionResult> ResumeAuction(long matchDayId) => Ok(await sessionService.ResumeAuctionAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/end")]
    public async Task<IActionResult> EndAuction(long matchDayId) => Ok(await sessionService.EndAuctionAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/next-player")]
    public async Task<IActionResult> NextPlayer(long matchDayId) => Ok(await sessionService.NextPlayerAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/next-player/random")]
    public async Task<IActionResult> NextPlayerRandom(long matchDayId) => Ok(await sessionService.NextPlayerRandomAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/skip-player")]
    public async Task<IActionResult> SkipPlayer(long matchDayId) => Ok(await sessionService.SkipPlayerAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/mark-sold")]
    public async Task<IActionResult> MarkSold(long matchDayId) => Ok(await sessionService.MarkSoldAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/mark-unsold")]
    public async Task<IActionResult> MarkUnsold(long matchDayId) => Ok(await sessionService.MarkUnsoldAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/undo-last-sale")]
    public async Task<IActionResult> UndoLastSale(long matchDayId) => Ok(await sessionService.UndoLastSaleAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/restart-bidding")]
    public async Task<IActionResult> RestartBidding(long matchDayId) => Ok(await sessionService.RestartBiddingAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/start-unsold-round")]
    public async Task<IActionResult> StartUnsoldRound(long matchDayId) => Ok(await sessionService.StartUnsoldRoundAsync(matchDayId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/select-player/{playerId}")]
    public async Task<IActionResult> SelectPlayerForAuction(long matchDayId, long playerId) =>
        Ok(await sessionService.SelectPlayerForAuctionAsync(matchDayId, playerId));

    [Authorize(Roles = BidderRoles)]
    [HttpPost("bids")]
    public async Task<IActionResult> PlaceBid(long matchDayId, [FromBody] BidRequest request)
    {
        var userId = currentUserService.GetPlayerId();
        return Ok(await sessionService.PlaceBidAsync(matchDayId, request, userId));
    }

    [AllowAnonymous]
    [HttpGet("bids")]
    public async Task<IActionResult> GetAllBids(long matchDayId) => Ok(await sessionService.GetAllBidsAsync(matchDayId));

    [AllowAnonymous]
    [HttpGet("players/{auctionPlayerId}/bids")]
    public async Task<IActionResult> GetBidsForPlayer(long matchDayId, long auctionPlayerId) =>
        Ok(await sessionService.GetBidsForPlayerAsync(matchDayId, auctionPlayerId));

    [AllowAnonymous]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(long matchDayId) => Ok(await sessionService.GetDashboardAsync(matchDayId));

    [AllowAnonymous]
    [HttpGet("results")]
    public async Task<IActionResult> GetResults(long matchDayId) => Ok(await sessionService.GetResultsAsync(matchDayId));
}
