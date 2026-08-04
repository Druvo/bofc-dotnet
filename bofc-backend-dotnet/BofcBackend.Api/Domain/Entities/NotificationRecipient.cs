namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// One row per (notification, recipient) — this is what makes a recipient's
/// notification history permanent and per-account (unlike the old client-side
/// localStorage log it replaces).
/// </summary>
public class NotificationRecipient : AuditableEntity
{
    public long Id { get; set; }

    public long NotificationId { get; set; }
    public Notification Notification { get; set; } = null!;

    public long RecipientId { get; set; }
    public Player Recipient { get; set; } = null!;

    public bool IsRead { get; set; }
    public DateTime? ReadDate { get; set; }
}
