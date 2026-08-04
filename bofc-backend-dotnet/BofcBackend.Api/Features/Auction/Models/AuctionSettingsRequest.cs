using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionSettingsRequest.java.</summary>
public class AuctionSettingsRequest
{
    [Required, Range(1, int.MaxValue)]
    public int? TeamBudget { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? MinSquadSize { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? MaxSquadSize { get; set; }

    [Required, Range(30, int.MaxValue)]
    public int? AuctionTimerSeconds { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? BidIncrement { get; set; }

    public bool? UnsoldReauctionEnabled { get; set; }

    [Range(5, int.MaxValue)]
    public int? TimerExtensionSeconds { get; set; }

    [Range(5, int.MaxValue)]
    public int? ExtendIfBidWithinLastSeconds { get; set; }

    public string? MinRoleRequirements { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
}
