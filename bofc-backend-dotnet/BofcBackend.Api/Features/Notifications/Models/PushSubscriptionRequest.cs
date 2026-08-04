using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Notifications.Models;

public class PushSubscriptionRequest
{
    [Required]
    public string Endpoint { get; set; } = string.Empty;

    [Required]
    public string P256dh { get; set; } = string.Empty;

    [Required]
    public string Auth { get; set; } = string.Empty;
}
