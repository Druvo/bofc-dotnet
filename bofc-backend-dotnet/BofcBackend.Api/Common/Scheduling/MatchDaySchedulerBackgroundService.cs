using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Keeps exactly one upcoming "Match Day" queued at all times — a Tournament row
/// (IsWeeklyMatchDay=true) auto-created weekly from SystemSettings.WeeklyMatch* config, reusing
/// the full existing Tournament system (Teams, fixtures, live scoring, stats, prizes) instead of
/// a separate bespoke model. As soon as the currently-queued Match Day's date passes, the next
/// tick creates next week's occurrence and notifies everyone to RSVP via the existing
/// TournamentParticipant flow (no new RSVP mechanism — see /tournaments/join-tournament/:id).
/// Hourly is frequent enough; this isn't time-critical.
/// </summary>
public class MatchDaySchedulerBackgroundService(IServiceScopeFactory scopeFactory, ILogger<MatchDaySchedulerBackgroundService> logger)
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
                logger.LogError(ex, "Match Day scheduler run failed");
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
        if (settings is not { WeeklyMatchEnabled: true } || settings.WeeklyMatchVenueId == null) return;

        var now = DateTime.Now;
        var hasUpcoming = await db.Tournaments.AnyAsync(t => t.IsWeeklyMatchDay && t.TournamentDate > now);
        if (hasUpcoming) return;

        var nextDate = ComputeNextOccurrence(now, settings.WeeklyMatchDayOfWeek, settings.WeeklyMatchTime);

        // Auto-created MatchDays are always THE default — clear it off every other tournament first
        // to preserve the single-default invariant TournamentService enforces for manual creates/updates.
        await db.Tournaments.Where(t => t.DefaultTournament)
            .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.DefaultTournament, false));

        var tournament = new Tournament
        {
            Name = $"{settings.WeeklyMatchNamePrefix} — {nextDate:MMM d, yyyy}",
            TournamentDate = nextDate,
            DurationMinutes = settings.WeeklyMatchDurationMinutes,
            VenueId = settings.WeeklyMatchVenueId.Value,
            TournamentStatus = TournamentStatus.UPCOMING,
            IsActive = true,
            SportType = settings.WeeklyMatchSportType,
            TournamentType = TournamentType.ROUND_ROBIN,
            AuctionMode = false,
            DefaultTournament = true,
            IsWeeklyMatchDay = true,
        };
        db.Tournaments.Add(tournament);
        await db.SaveChangesAsync();

        var activePlayers = await db.Players.Where(p => p.IsActive).Select(p => new { p.Id, p.Email }).ToListAsync();
        if (activePlayers.Count == 0) return;

        var venueName = await db.Venues.Where(v => v.Id == tournament.VenueId).Select(v => v.Name).FirstOrDefaultAsync() ?? "TBD";
        var title = $"{settings.WeeklyMatchNamePrefix} — {nextDate:dddd, MMM d}";
        var body = $"{nextDate:dddd, MMM d} at {nextDate:h:mm tt}, {venueName}. Are you in?";

        var notification = new Notification { Title = title, Body = body, TargetType = NotificationTargetType.ALL };
        db.Notifications.Add(notification);
        db.NotificationRecipients.AddRange(activePlayers.Select(p => new NotificationRecipient
        {
            Notification = notification,
            RecipientId = p.Id,
            IsRead = false,
        }));
        await db.SaveChangesAsync();

        try
        {
            var emails = activePlayers.Where(p => p.Email != "").Select(p => p.Email);
            await emailSender.SendAsync(emails, title, $"<p>{System.Net.WebUtility.HtmlEncode(body)}</p>");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed emailing Match Day invite for tournament {TournamentId}", tournament.Id);
        }
    }

    /// <summary>Smallest date/time strictly after <paramref name="afterExclusive"/> that falls on <paramref name="targetDay"/> at <paramref name="targetTime"/>.</summary>
    private static DateTime ComputeNextOccurrence(DateTime afterExclusive, DayOfWeek targetDay, TimeSpan targetTime)
    {
        var candidate = afterExclusive.Date + targetTime;
        var dayDiff = ((int)targetDay - (int)candidate.DayOfWeek + 7) % 7;
        candidate = candidate.AddDays(dayDiff);
        if (candidate <= afterExclusive)
        {
            candidate = candidate.AddDays(7);
        }
        return candidate;
    }
}
