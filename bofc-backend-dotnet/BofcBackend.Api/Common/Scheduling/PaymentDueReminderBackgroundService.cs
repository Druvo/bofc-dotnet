using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.EmailTemplates;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// From Settings.PaymentDueReminderDayOfMonth onward, re-emails and in-app-notifies every active
/// player who still has no AcCollection recorded for the current calendar month, every
/// Settings.PaymentDueReminderRepeatDays - not just once. A player drops out of the recipient
/// list the moment a collection is recorded for them, so the nagging naturally stops once they
/// pay; nobody who's already paid ever gets a reminder. Guarded by LastPaymentReminderSentAt so a
/// 6-hourly tick doesn't re-send far more often than the configured interval.
/// </summary>
public class PaymentDueReminderBackgroundService(IServiceScopeFactory scopeFactory, ILogger<PaymentDueReminderBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(6));
        do
        {
            try
            {
                await RunOnceAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Payment due reminder scheduler run failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunOnceAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BofcDbContext>();
        var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        var emailTemplateService = scope.ServiceProvider.GetRequiredService<IEmailTemplateService>();

        var settings = await db.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is not { NotifyPaymentDueEnabled: true }) return;

        var today = ClubTime.Now;
        if (today.Day < settings.PaymentDueReminderDayOfMonth) return;
        if (settings.LastPaymentReminderSentAt != null
            && (today - settings.LastPaymentReminderSentAt.Value).TotalDays < settings.PaymentDueReminderRepeatDays)
        {
            return;
        }

        await SendRemindersAsync(db, emailSender, emailTemplateService, logger, today.Year, today.Month);
        settings.LastPaymentReminderSentAt = today;
        await db.SaveChangesAsync();
    }

    /// <summary>Emails+notifies every active player still unpaid for <paramref name="year"/>/<paramref name="month"/>.
    /// Shared by the scheduled tick above (always the current month, gated by day-of-month/repeat-interval)
    /// and the admin "Send Payment Due Email" action on the Player Monthly Payments page
    /// (SettingsService.SendPaymentDueReminderNowAsync, which bypasses those gates entirely and
    /// lets the admin pick any month via a popup defaulting to the current one - an explicit
    /// manual send shouldn't be blocked by "too soon since the last automatic one"). Caller is
    /// responsible for persisting LastPaymentReminderSentAt/SaveChanges - this only queries/sends.
    /// Due is returned alongside Sent so a caller can tell "nobody owed anything" apart from "owed
    /// but SMTP isn't configured" - both look like Sent=0 otherwise.</summary>
    public static async Task<(int Due, int Sent)> SendRemindersAsync(BofcDbContext db, IEmailSender emailSender, IEmailTemplateService emailTemplateService, ILogger logger, int year, int month)
    {
        var paidPlayerIds = await db.AcCollections
            .Where(c => c.MonthOfPayment.Year == year && c.MonthOfPayment.Month == month)
            .SelectMany(c => c.Players.Select(p => p.Id))
            .Distinct()
            .ToListAsync();

        var duePlayers = await db.Players
            .Where(p => p.IsActive && !p.IsPaused && p.EmailNotificationsEnabled && !paidPlayerIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name, p.Email })
            .ToListAsync();

        if (duePlayers.Count == 0) return (0, 0);

        var monthYear = new DateTime(year, month, 1).ToString("MMMM yyyy");

        // In-app notification text is short/plain, independent of the templated email body
        // (which is now a full standalone HTML document, not something to dump into a
        // notification card).
        var notification = new Notification
        {
            Title = "Club dues reminder",
            Body = $"Your {monthYear} club dues payment hasn't been recorded yet.",
            TargetType = NotificationTargetType.ALL,
        };
        db.Notifications.Add(notification);
        db.NotificationRecipients.AddRange(duePlayers.Select(p => new NotificationRecipient
        {
            Notification = notification,
            RecipientId = p.Id,
            IsRead = false,
        }));

        var sent = 0;

        // Personalized per player (not a single batch send) - {{PlayerName}} needs each
        // recipient's own name substituted in.
        foreach (var player in duePlayers)
        {
            if (string.IsNullOrWhiteSpace(player.Email)) continue;

            var (title, body) = await emailTemplateService.RenderAsync(
                EmailTemplateKeys.PaymentDueReminder,
                new Dictionary<string, string> { ["PlayerName"] = player.Name, ["MonthYear"] = monthYear });

            try
            {
                var result = await emailSender.SendAsync([player.Email], title, body);
                sent += result.Sent;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed emailing payment-due reminder to player {PlayerId} for {Month}", player.Id, monthYear);
            }
        }

        // Same reasoning as the MatchDay reminder: the "last sent" marker moves regardless, so a
        // wholly-failed batch is invisible unless it announces itself.
        if (sent == 0 && duePlayers.Count > 0)
        {
            logger.LogError(
                "Payment-due reminder for {Month} reached none of its {Count} target player(s) - every send failed. Check the SMTP settings.",
                monthYear, duePlayers.Count);
        }

        return (duePlayers.Count, sent);
    }
}
