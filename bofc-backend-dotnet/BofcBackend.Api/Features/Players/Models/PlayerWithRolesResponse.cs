using System.Text.Json.Serialization;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Players.Models;

/// <summary>Port of model/PlayerWithRolesResponse.java.</summary>
public class PlayerWithRolesResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? MobileNo { get; set; }
    public string TeamsId { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;

    /// <summary>Java's `private boolean isActive` — Jackson strips the "is" prefix, wire property is "active" (see PlayerResponse.cs).</summary>
    [JsonPropertyName("active")]
    public bool IsActive { get; set; }
    public FootballPosition PlayingPosition { get; set; }
    /// <summary>
    /// A list, not a HashSet, even though Java models it as Set&lt;RoleResponse&gt; — Java's set
    /// dedupes via Lombok-generated equals/hashCode, which C#'s reference-equality HashSet
    /// wouldn't replicate; a list serializes to the same JSON array and roles are already
    /// unique coming from the DB relationship.
    /// </summary>
    public List<RoleResponse> Roles { get; set; } = [];
}
