namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionDashboardResponse.java.</summary>
public class AuctionDashboardResponse
{
    public AuctionSessionResponse? Session { get; set; }
    public AuctionPlayerResponse? CurrentPlayer { get; set; }
    public List<BidResponse> CurrentPlayerBids { get; set; } = [];
    public List<TeamBudgetResponse> TeamBudgets { get; set; } = [];
    public List<AuctionPlayerResponse> SoldPlayers { get; set; } = [];
    public List<AuctionPlayerResponse> UnsoldPlayers { get; set; } = [];
    public AuctionStatsResponse Statistics { get; set; } = new();
    public long TotalPlayers { get; set; }
    public long SoldCount { get; set; }
    public long UnsoldCount { get; set; }
    public long RemainingCount { get; set; }
}
