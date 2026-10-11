using System.Text.Json.Serialization;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/PlayerCollectionReport.java.</summary>
public class PlayerCollectionReport
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;

    /// <summary>Java's `private boolean isActive` - Jackson strips the "is" prefix, wire property is "active" (confirmed against frontend IPlayerCollectionMetrics.PlayerMetric.active).</summary>
    [JsonPropertyName("active")]
    public bool IsActive { get; set; }

    /// <summary>Temporarily away - see Player.IsPaused. Carried alongside `active` because the
    /// "is this player behind this month?" question is answered from this payload, and a paused
    /// player is never chased for payment (PaymentDueReminderBackgroundService has always
    /// skipped them). Their history stays in the report either way - pausing stops the club
    /// asking, it does not erase what they have paid.</summary>
    public bool Paused { get; set; }

    /// <summary>year -> (month -> amount).</summary>
    public Dictionary<int, Dictionary<int, decimal>> YearMonthAmount { get; set; } = [];

    /// <summary>year -> months (1-12) an admin has omitted for this player - see PaymentWaiver.
    /// A waived month is never Due and never reminded about, whatever was paid.</summary>
    public Dictionary<int, List<int>> WaivedMonths { get; set; } = [];
}
