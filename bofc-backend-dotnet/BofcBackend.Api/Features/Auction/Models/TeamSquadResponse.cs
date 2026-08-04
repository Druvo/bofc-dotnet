namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/TeamSquadResponse.java.</summary>
public class TeamSquadResponse
{
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public int TotalBudget { get; set; }
    public int TotalSpent { get; set; }
    public int RemainingBudget { get; set; }
    public int PlayerCount { get; set; }
    public List<AuctionPlayerResponse> Players { get; set; } = [];
}
