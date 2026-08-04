using System.Text.Json.Serialization;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcVoucherTypeResponse.java.</summary>
public class AcVoucherTypeResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Java's `private boolean isDefault` — Jackson strips the "is" prefix, wire property is "default" (confirmed against frontend IAcVoucherType.default).</summary>
    [JsonPropertyName("default")]
    public bool IsDefault { get; set; }
}
