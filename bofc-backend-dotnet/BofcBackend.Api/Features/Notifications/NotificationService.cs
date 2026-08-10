using System.Net;
using System.Text.Json;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Notifications.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WebPush;
using WebPushSubscription = WebPush.PushSubscription;

namespace BofcBackend.Api.Features.Notifications;

public class NotificationService(
    BofcDbContext db, IOptions<VapidOptions> vapidOptions, IEmailSender emailSender, ILogger<NotificationService> logger)
    : INotificationService
{
    public async Task SendAsync(SendNotificationRequest request, long senderId)
    {
        var recipientIds = request.TargetType == NotificationTargetType.ALL
            ? await db.Players.Select(p => p.Id).ToListAsync()
            : request.UserIds?.Distinct().ToList() ?? [];

        if (request.TargetType == NotificationTargetType.CUSTOM && recipientIds.Count == 0)
        {
            throw new BadRequestException(RestErrorMessageDetail.NotificationTargetUsersRequired);
        }

        var notification = new Notification
        {
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            TargetType = request.TargetType,
        };
        db.Notifications.Add(notification);

        var recipientRows = recipientIds.Select(id => new NotificationRecipient
        {
            Notification = notification,
            RecipientId = id,
            IsRead = false,
        }).ToList();
        db.NotificationRecipients.AddRange(recipientRows);

        await db.SaveChangesAsync();

        await PushToRecipientsAsync(notification, recipientIds);

        if (request.SendEmail)
        {
            await EmailRecipientsAsync(notification, recipientIds);
        }
    }

    private async Task EmailRecipientsAsync(Notification notification, List<long> recipientIds)
    {
        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is not { NotifyCustomEmailEnabled: true })
        {
            logger.LogInformation("Custom email notifications are disabled in Settings - skipping email for notification {NotificationId}", notification.Id);
            return;
        }

        var emails = await db.Players
            .Where(p => recipientIds.Contains(p.Id) && p.Email != "")
            .Select(p => p.Email)
            .ToListAsync();
        if (emails.Count == 0) return;

        var htmlBody = $"<p>{System.Net.WebUtility.HtmlEncode(notification.Body)}</p>";
        await emailSender.SendAsync(emails, notification.Title, htmlBody);
    }

    private async Task PushToRecipientsAsync(Notification notification, List<long> recipientIds)
    {
        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is { PushNotificationsEnabled: false })
        {
            logger.LogInformation("Push notifications are disabled in Settings - skipping push for notification {NotificationId}", notification.Id);
            return;
        }

        var vapid = vapidOptions.Value;
        if (string.IsNullOrWhiteSpace(vapid.PublicKey) || string.IsNullOrWhiteSpace(vapid.PrivateKey))
        {
            logger.LogWarning("Vapid keys are not configured - skipping push delivery for notification {NotificationId}", notification.Id);
            return;
        }

        var subscriptions = await db.PushSubscriptions
            .Where(s => recipientIds.Contains(s.PlayerId))
            .ToListAsync();
        if (subscriptions.Count == 0) return;

        var vapidDetails = new VapidDetails(vapid.Subject, vapid.PublicKey, vapid.PrivateKey);
        var client = new WebPushClient();
        var payload = JsonSerializer.Serialize(new { title = notification.Title, body = notification.Body });
        var deadSubscriptionIds = new List<long>();

        foreach (var subscription in subscriptions)
        {
            try
            {
                var pushSubscription = new WebPushSubscription(subscription.Endpoint, subscription.P256dh, subscription.Auth);
                await client.SendNotificationAsync(pushSubscription, payload, vapidDetails);
            }
            catch (WebPushException ex) when (ex.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                // Subscription expired or the user unsubscribed at the browser level - prune it.
                deadSubscriptionIds.Add(subscription.Id);
            }
            catch (WebPushException ex)
            {
                logger.LogWarning(ex, "Push delivery failed for subscription {SubscriptionId}", subscription.Id);
            }
        }

        if (deadSubscriptionIds.Count > 0)
        {
            db.PushSubscriptions.RemoveRange(db.PushSubscriptions.Where(s => deadSubscriptionIds.Contains(s.Id)));
            await db.SaveChangesAsync();
        }
    }

    public async Task<PaginatedNotificationResponse> GetMyNotificationsAsync(long recipientId, int offSet, int pageSize)
    {
        var query = db.NotificationRecipients.Where(nr => nr.RecipientId == recipientId);

        var totalCount = await query.LongCountAsync();
        var unreadCount = await query.LongCountAsync(nr => !nr.IsRead);

        var items = await query
            .Include(nr => nr.Notification)
            .OrderByDescending(nr => nr.NotificationId)
            .Skip(offSet)
            .Take(pageSize)
            .Select(nr => new NotificationHistoryItemResponse
            {
                Id = nr.Id,
                NotificationId = nr.NotificationId,
                Title = nr.Notification.Title,
                Body = nr.Notification.Body,
                SentDate = nr.Notification.CreatedDate,
                IsRead = nr.IsRead,
                ReadDate = nr.ReadDate,
            })
            .ToListAsync();

        return new PaginatedNotificationResponse(items, totalCount, unreadCount);
    }

    public async Task MarkReadAsync(long recipientId, long recipientRowId)
    {
        var row = await db.NotificationRecipients.FirstOrDefaultAsync(nr => nr.Id == recipientRowId && nr.RecipientId == recipientId)
            ?? throw new ResourceNotFoundException(RestErrorMessageDetail.NotificationNotFound);

        if (row.IsRead) return;
        row.IsRead = true;
        row.ReadDate = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task MarkAllReadAsync(long recipientId)
    {
        var now = DateTime.UtcNow;
        await db.NotificationRecipients
            .Where(nr => nr.RecipientId == recipientId && !nr.IsRead)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(nr => nr.IsRead, true)
                .SetProperty(nr => nr.ReadDate, now));
    }

    public string GetVapidPublicKey() => vapidOptions.Value.PublicKey;

    public async Task SaveSubscriptionAsync(long playerId, PushSubscriptionRequest request)
    {
        var existing = await db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.PlayerId == playerId && s.Endpoint == request.Endpoint);

        if (existing != null)
        {
            existing.P256dh = request.P256dh;
            existing.Auth = request.Auth;
        }
        else
        {
            db.PushSubscriptions.Add(new BofcBackend.Api.Domain.Entities.PushSubscription
            {
                PlayerId = playerId,
                Endpoint = request.Endpoint,
                P256dh = request.P256dh,
                Auth = request.Auth,
            });
        }

        await db.SaveChangesAsync();
    }

    public async Task RemoveSubscriptionAsync(long playerId, string endpoint)
    {
        await db.PushSubscriptions
            .Where(s => s.PlayerId == playerId && s.Endpoint == endpoint)
            .ExecuteDeleteAsync();
    }
}
