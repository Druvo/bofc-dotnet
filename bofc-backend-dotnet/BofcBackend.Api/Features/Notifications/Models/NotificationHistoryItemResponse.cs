namespace BofcBackend.Api.Features.Notifications.Models;

public class NotificationHistoryItemResponse
{
    public long Id { get; set; }
    public long NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime SentDate { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadDate { get; set; }
}
