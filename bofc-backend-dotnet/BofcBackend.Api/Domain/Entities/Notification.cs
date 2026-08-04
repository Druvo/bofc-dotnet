using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>An admin-composed notification. CreatedBy (from AuditableEntity) is the sender.</summary>
public class Notification : AuditableEntity
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationTargetType TargetType { get; set; }

    public ICollection<NotificationRecipient> Recipients { get; set; } = new List<NotificationRecipient>();
}
