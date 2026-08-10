using System.Text.Json.Serialization;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/CostTypeResponse.java.</summary>
public class CostTypeResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Java's `private boolean isActive` - Jackson strips the "is" prefix, wire property is "active" (see PlayerResponse.cs).</summary>
    [JsonPropertyName("active")]
    public bool IsActive { get; set; }
}
