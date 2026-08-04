using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Auction;

/// <summary>
/// Port of controller/auction/AuctionSessionController.java. Unlike the rest of the app, every
/// action here returns the DTO directly (Ok(x)), NOT the usual {message,statusCode,content}
/// envelope — Java's controller returns raw ResponseEntity&lt;T&gt; throughout, and the frontend's
/// auction slice reads the response body as the DTO itself, not response.data.content.
/// </summary>
[ApiController]
[Route("tournaments/{tournamentId}/auction")]
public class AuctionSessionController(AuctionSessionService sessionService, ICurrentUserService currentUserService) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;
    private const string BidderRoles = PlayerRoleNames.TeamOwner + "," + PlayerRoleNames.Player + "," + PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin;

    [AllowAnonymous]
    [HttpGet("session")]
    public async Task<IActionResult> GetSession(long tournamentId) => Ok(await sessionService.GetSessionAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/start")]
    public async Task<IActionResult> StartAuction(long tournamentId) => Ok(await sessionService.StartAuctionAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/pause")]
    public async Task<IActionResult> PauseAuction(long tournamentId) => Ok(await sessionService.PauseAuctionAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/resume")]
    public async Task<IActionResult> ResumeAuction(long tournamentId) => Ok(await sessionService.ResumeAuctionAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/end")]
    public async Task<IActionResult> EndAuction(long tournamentId) => Ok(await sessionService.EndAuctionAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/next-player")]
    public async Task<IActionResult> NextPlayer(long tournamentId) => Ok(await sessionService.NextPlayerAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/next-player/random")]
    public async Task<IActionResult> NextPlayerRandom(long tournamentId) => Ok(await sessionService.NextPlayerRandomAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/skip-player")]
    public async Task<IActionResult> SkipPlayer(long tournamentId) => Ok(await sessionService.SkipPlayerAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/mark-sold")]
    public async Task<IActionResult> MarkSold(long tournamentId) => Ok(await sessionService.MarkSoldAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/mark-unsold")]
    public async Task<IActionResult> MarkUnsold(long tournamentId) => Ok(await sessionService.MarkUnsoldAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/undo-last-sale")]
    public async Task<IActionResult> UndoLastSale(long tournamentId) => Ok(await sessionService.UndoLastSaleAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/restart-bidding")]
    public async Task<IActionResult> RestartBidding(long tournamentId) => Ok(await sessionService.RestartBiddingAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/start-unsold-round")]
    public async Task<IActionResult> StartUnsoldRound(long tournamentId) => Ok(await sessionService.StartUnsoldRoundAsync(tournamentId));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("session/select-player/{playerId}")]
    public async Task<IActionResult> SelectPlayerForAuction(long tournamentId, long playerId) =>
        Ok(await sessionService.SelectPlayerForAuctionAsync(tournamentId, playerId));

    [Authorize(Roles = BidderRoles)]
    [HttpPost("bids")]
    public async Task<IActionResult> PlaceBid(long tournamentId, [FromBody] BidRequest request)
    {
        var userId = currentUserService.GetPlayerId();
        return Ok(await sessionService.PlaceBidAsync(tournamentId, request, userId));
    }

    [AllowAnonymous]
    [HttpGet("bids")]
    public async Task<IActionResult> GetAllBids(long tournamentId) => Ok(await sessionService.GetAllBidsAsync(tournamentId));

    [AllowAnonymous]
    [HttpGet("players/{auctionPlayerId}/bids")]
    public async Task<IActionResult> GetBidsForPlayer(long tournamentId, long auctionPlayerId) =>
        Ok(await sessionService.GetBidsForPlayerAsync(tournamentId, auctionPlayerId));

    [AllowAnonymous]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(long tournamentId) => Ok(await sessionService.GetDashboardAsync(tournamentId));

    [AllowAnonymous]
    [HttpGet("results")]
    public async Task<IActionResult> GetResults(long tournamentId) => Ok(await sessionService.GetResultsAsync(tournamentId));
}
