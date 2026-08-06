using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/auction/AuctionSettings.java.</summary>
public class AuctionSettings : AuditableEntity
{
    public long Id { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public int TeamBudget { get; set; }
    public int MinSquadSize { get; set; }
    public int MaxSquadSize { get; set; }
    public int AuctionTimerSeconds { get; set; }
    public int BidIncrement { get; set; }
    public bool UnsoldReauctionEnabled { get; set; }
    public int TimerExtensionSeconds { get; set; }
    public int ExtendIfBidWithinLastSeconds { get; set; }

    /// <summary>JSON-ish free text, matches Java's columnDefinition = "JSON".</summary>
    public string? MinRoleRequirements { get; set; }

    public AuctionStatus AuctionStatus { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
}
