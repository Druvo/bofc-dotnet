namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>
/// Port of model/auction/AuctionWebSocketMessage.java. Type strings are Java's actual broadcast
/// values verbatim (NEW_BID, TIMER_EXPIRED, etc) — NOT the frontend TS union in auctionTypes.ts,
/// which lists BID_PLACED/TIMER_UPDATE that the real Java server has never actually sent. The
/// frontend's message handler refetches on ANY message regardless of type and only special-cases
/// 3 of 12 types for an optional background-tab notification, so this pre-existing mismatch is
/// harmless — replicated as-is rather than "corrected" to match the aspirational TS type.
/// </summary>
public class AuctionWebSocketMessage
{
    public string Type { get; set; } = string.Empty;
    public long TournamentId { get; set; }
    public object? Payload { get; set; }
}
