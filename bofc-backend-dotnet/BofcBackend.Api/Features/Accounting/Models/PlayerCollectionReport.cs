using System.Text.Json.Serialization;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/PlayerCollectionReport.java.</summary>
public class PlayerCollectionReport
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;

    /// <summary>Java's `private boolean isActive` — Jackson strips the "is" prefix, wire property is "active" (confirmed against frontend IPlayerCollectionMetrics.PlayerMetric.active).</summary>
    [JsonPropertyName("active")]
    public bool IsActive { get; set; }

    /// <summary>year -> (month -> amount).</summary>
    public Dictionary<int, Dictionary<int, decimal>> YearMonthAmount { get; set; } = [];
}
