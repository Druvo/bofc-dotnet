using BofcBackend.Api.Features.Notifications.Models;

namespace BofcBackend.Api.Features.Notifications;

public interface INotificationService
{
    Task SendAsync(SendNotificationRequest request, long senderId);

    Task<PaginatedNotificationResponse> GetMyNotificationsAsync(long recipientId, int offSet, int pageSize);

    /// <summary>recipientRowId is NotificationHistoryItemResponse.Id (the recipient row's own id, not the notification's).</summary>
    Task MarkReadAsync(long recipientId, long recipientRowId);

    Task MarkAllReadAsync(long recipientId);

    string GetVapidPublicKey();

    Task SaveSubscriptionAsync(long playerId, PushSubscriptionRequest request);

    Task RemoveSubscriptionAsync(long playerId, string endpoint);
}
