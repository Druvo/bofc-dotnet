namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/TeamBudgetResponse.java.</summary>
public class TeamBudgetResponse
{
    public long Id { get; set; }
    public long TournamentId { get; set; }
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public int TotalBudget { get; set; }
    public int RemainingBudget { get; set; }
    public int TotalSpent { get; set; }
    public int PlayersBought { get; set; }
}
