using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Notifications.Models;

public class SendNotificationRequest
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Body { get; set; } = string.Empty;

    [Required]
    public NotificationTargetType TargetType { get; set; }

    /// <summary>Required (non-empty) when TargetType is CUSTOM — covers both "one specific user" and "several selected users".</summary>
    public List<long>? UserIds { get; set; }
}
