using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>
/// Port of model/auction/BidRequest.java - deliberately just these two fields. The frontend's
/// BidRequest TS type also sends an auctionPlayerId, but Java's model doesn't declare it (bids
/// always target session.currentAuctionPlayer server-side, never a client-specified id) and
/// silently ignores the extra JSON property; System.Text.Json does the same by default, so
/// omitting the field here reproduces that exact behavior rather than "fixing" it.
/// </summary>
public class BidRequest
{
    [Required]
    public long? TeamId { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? BidAmount { get; set; }
}
