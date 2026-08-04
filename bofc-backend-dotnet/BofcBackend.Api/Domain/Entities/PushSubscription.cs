namespace BofcBackend.Api.Domain.Entities;

/// <summary>A single browser/device's Web Push subscription for a player. One player can have several (multi-device).</summary>
public class PushSubscription : AuditableEntity
{
    public long Id { get; set; }

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public string Endpoint { get; set; } = string.Empty;
    public string P256dh { get; set; } = string.Empty;
    public string Auth { get; set; } = string.Empty;
}
