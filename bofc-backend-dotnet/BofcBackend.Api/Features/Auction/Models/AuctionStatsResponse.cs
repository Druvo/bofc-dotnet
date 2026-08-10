namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>
/// Port of model/auction/AuctionStatsResponse.java. MostActiveBiddingTeam/HighestBidWarCount/
/// HighestBidWarPlayerName are never populated by Java's calculateStats either - kept for wire
/// parity, always null.
/// </summary>
public class AuctionStatsResponse
{
    public string? MostExpensivePlayerName { get; set; }
    public int? MostExpensivePrice { get; set; }
    public string? CheapestSoldPlayerName { get; set; }
    public int? CheapestSoldPrice { get; set; }
    public int? AverageSalePrice { get; set; }
    public int? TotalMoneySpent { get; set; }
    public string? MostActiveBiddingTeam { get; set; }
    public int? HighestBidWarCount { get; set; }
    public string? HighestBidWarPlayerName { get; set; }
}
