namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/BidResponse.java.</summary>
public class BidResponse
{
    public long Id { get; set; }
    public long AuctionPlayerId { get; set; }
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public long BidderUserId { get; set; }
    public string BidderName { get; set; } = string.Empty;
    public int BidAmount { get; set; }
    public DateTime BidTime { get; set; }
    public bool IsWinning { get; set; }
}
