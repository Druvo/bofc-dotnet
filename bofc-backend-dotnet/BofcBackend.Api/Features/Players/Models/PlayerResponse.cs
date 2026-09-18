using System.Text.Json.Serialization;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Players.Models;

public class PlayerResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? MobileNo { get; set; }
    public string TeamsId { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePhoto { get; set; }

    /// <summary>
    /// Java's field is `private boolean isActive` - Lombok's boolean getter isActive() gets its
    /// "is" prefix stripped by Jackson's default bean-property naming, so the real wire property
    /// is "active", not "isActive". Confirmed against real (non-stale) frontend usage in
    /// Players.tsx (record.active, response.data.content.active) - not just the TS interface.
    /// </summary>
    [JsonPropertyName("active")]
    public bool IsActive { get; set; }
    public FootballPosition PlayingPosition { get; set; }
    public int? JerseyNumber { get; set; }
    public HashSet<RoleResponse> Roles { get; set; } = [];
    public string? PhotoKey { get; set; }
    public string? PhotoUrl { get; set; }
    public string? ThemePreference { get; set; }
    public bool EmailNotificationsEnabled { get; set; }

    /// <summary>Temporarily away - see Player.IsPaused. Carried here, unlike Rank and the
    /// goalkeeper flags, because it is availability rather than tactics: `active` is already on
    /// this response and this is the same kind of fact, and the player list needs it to show who
    /// is paused without opening every profile in turn.</summary>
    public bool Paused { get; set; }
}
