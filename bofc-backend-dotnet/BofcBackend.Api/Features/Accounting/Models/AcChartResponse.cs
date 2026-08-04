using System.Text.Json.Serialization;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcChartResponse.java.</summary>
public class AcChartResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AcChartResponse? Parent { get; set; }
    public long? ParentNo { get; set; }
    public AcNatureResponse Nature { get; set; } = null!;
    public long NatureNo { get; set; }

    /// <summary>Java's `private boolean isActive` — Jackson strips the "is" prefix, wire property is "active" (confirmed against frontend IAcChart.active).</summary>
    [JsonPropertyName("active")]
    public bool IsActive { get; set; }
}
