using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Hourly check for UPCOMING tournaments starting within Settings.TournamentReminderDaysBefore
/// that haven't been reminded yet (Tournament.ReminderSentAt). Sends an in-app notification to
/// every player, plus email if Settings.NotifyTournamentReminderEnabled and SMTP are configured.
/// Hourly (not daily) so a reminder set for "3 days before" still fires promptly even if the
/// app was down when a coarser daily check would have run.
/// </summary>
public class TournamentReminderBackgroundService(IServiceScopeFactory scopeFactory, ILogger<TournamentReminderBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        do
        {
            try
            {
                await RunOnceAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Tournament reminder scheduler run failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunOnceAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BofcDbContext>();
        var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();

        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is not { NotifyTournamentReminderEnabled: true }) return;

        var now = DateTime.Now;
        var cutoff = now.AddDays(settings.TournamentReminderDaysBefore);

        var dueTournaments = await db.Tournaments
            .Where(t => t.TournamentStatus == TournamentStatus.UPCOMING
                && t.ReminderSentAt == null
                && t.TournamentDate <= cutoff
                && t.TournamentDate >= now)
            .Include(t => t.Venue)
            .ToListAsync();

        if (dueTournaments.Count == 0) return;

        var activePlayers = await db.Players.Where(p => p.IsActive).Select(p => new { p.Id, p.Email }).ToListAsync();
        if (activePlayers.Count == 0) return;

        foreach (var tournament in dueTournaments)
        {
            var title = $"Upcoming tournament: {tournament.Name}";
            var body = $"{tournament.Name} starts on {tournament.TournamentDate:MMMM d, yyyy 'at' h:mm tt} at {tournament.Venue.Name}.";

            var notification = new Notification { Title = title, Body = body, TargetType = NotificationTargetType.ALL };
            db.Notifications.Add(notification);
            db.NotificationRecipients.AddRange(activePlayers.Select(p => new NotificationRecipient
            {
                Notification = notification,
                RecipientId = p.Id,
                IsRead = false,
            }));

            tournament.ReminderSentAt = now;

            try
            {
                var emails = activePlayers.Where(p => p.Email != "").Select(p => p.Email);
                await emailSender.SendAsync(emails, title, $"<p>{System.Net.WebUtility.HtmlEncode(body)}</p>");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed emailing tournament reminder for tournament {TournamentId}", tournament.Id);
            }
        }

        await db.SaveChangesAsync();
    }
}
