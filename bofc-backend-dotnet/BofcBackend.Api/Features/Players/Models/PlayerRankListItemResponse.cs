namespace BofcBackend.Api.Features.Players.Models;

/// <summary>One row of the admin-only drag-and-drop rank board — just enough to render a
/// draggable player card (name/photo/jersey) plus its current rank slot.</summary>
public class PlayerRankListItemResponse
{
    public long PlayerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int? JerseyNumber { get; set; }
    public bool IsActive { get; set; }

    /// <summary>Null = not ranked yet.</summary>
    public int? Rank { get; set; }
}
