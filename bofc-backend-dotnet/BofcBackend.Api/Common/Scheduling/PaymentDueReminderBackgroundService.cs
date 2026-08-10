using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Once a day, on/after Settings.PaymentDueReminderDayOfMonth, emails and in-app-notifies every
/// active player who has no AcCollection recorded for the current calendar month. Guarded by
/// Settings.LastPaymentReminderSentMonth ("yyyy-MM") so it only actually fires once per month -
/// checking on every tick past the trigger day (rather than only exactly on that day) means a
/// missed day (app down) still catches up instead of silently skipping the month.
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

        var settings = await db.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is not { NotifyPaymentDueEnabled: true }) return;

        var today = DateTime.Now;
        var currentMonthKey = today.ToString("yyyy-MM");
        if (today.Day < settings.PaymentDueReminderDayOfMonth) return;
        if (settings.LastPaymentReminderSentMonth == currentMonthKey) return;

        var paidPlayerIds = await db.AcCollections
            .Where(c => c.MonthOfPayment.Year == today.Year && c.MonthOfPayment.Month == today.Month)
            .SelectMany(c => c.Players.Select(p => p.Id))
            .Distinct()
            .ToListAsync();

        var duePlayers = await db.Players
            .Where(p => p.IsActive && !paidPlayerIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name, p.Email })
            .ToListAsync();

        if (duePlayers.Count > 0)
        {
            var title = $"Payment due - {today:MMMM yyyy}";
            var body = $"You haven't paid your club dues for {today:MMMM yyyy} yet. Please settle it at your earliest convenience.";

            var notification = new Notification { Title = title, Body = body, TargetType = NotificationTargetType.ALL };
            db.Notifications.Add(notification);
            db.NotificationRecipients.AddRange(duePlayers.Select(p => new NotificationRecipient
            {
                Notification = notification,
                RecipientId = p.Id,
                IsRead = false,
            }));

            try
            {
                var emails = duePlayers.Where(p => p.Email != "").Select(p => p.Email);
                await emailSender.SendAsync(emails, title, $"<p>{System.Net.WebUtility.HtmlEncode(body)}</p>");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed emailing payment-due reminders for {Month}", currentMonthKey);
            }
        }

        settings.LastPaymentReminderSentMonth = currentMonthKey;
        await db.SaveChangesAsync();
    }
}
