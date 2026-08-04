namespace BofcBackend.Api.Features.Notifications.Models;

public class PaginatedNotificationResponse(List<NotificationHistoryItemResponse> notifications, long totalCount, long unreadCount)
{
    public List<NotificationHistoryItemResponse> Notifications { get; } = notifications;
    public long TotalCount { get; } = totalCount;
    public long UnreadCount { get; } = unreadCount;
}
