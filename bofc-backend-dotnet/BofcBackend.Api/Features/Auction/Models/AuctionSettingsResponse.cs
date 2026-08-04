using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionSettingsResponse.java.</summary>
public class AuctionSettingsResponse
{
    public long Id { get; set; }
    public long TournamentId { get; set; }
    public int TeamBudget { get; set; }
    public int MinSquadSize { get; set; }
    public int MaxSquadSize { get; set; }
    public int AuctionTimerSeconds { get; set; }
    public int BidIncrement { get; set; }
    public bool UnsoldReauctionEnabled { get; set; }
    public int TimerExtensionSeconds { get; set; }
    public int ExtendIfBidWithinLastSeconds { get; set; }
    public string? MinRoleRequirements { get; set; }
    public AuctionStatus AuctionStatus { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
}
