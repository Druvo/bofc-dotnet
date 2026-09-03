using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Keeps every configured WeeklyMatchDaySlot covered for the current month - one MatchDay row
/// (IsWeeklyMatchDay=true) per (week, slot) pair, reusing the full existing MatchDay system
/// (Teams, fixtures, live scoring, stats, prizes) instead of a separate bespoke model. A slot is
/// identified by its immutable AutoGenSlotDayOfWeek/AutoGenWeekStart (not MatchDayDate), so an
/// admin manually moving a generated MatchDay's date never causes a duplicate to be created for
/// that week. Once a generated MatchDay is within WeeklyMatchDayAutoTeamsLeadHours of kickoff, this
/// also auto-drafts confirmed participants into teams and schedules their fixtures (see
/// WeeklyMatchDayTeamGenerator). Hourly is frequent enough; none of this is time-critical.
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

        var settings = await db.SystemSettings.AsNoTracking()
            .Include(s => s.WeeklyMatchDaySlots)
            .FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is not { WeeklyMatchDayEnabled: true } || settings.WeeklyMatchDayVenueId == null) return;
        if (settings.WeeklyMatchDaySlots.Count == 0) return;

        await GenerateForCurrentMonthAsync(db, settings, DateTime.Now);

        if (settings.WeeklyMatchDayAutoTeamsEnabled)
        {
            var teamGenerator = scope.ServiceProvider.GetRequiredService<WeeklyMatchDayTeamGenerator>();
            await GenerateDueTeamsAsync(db, teamGenerator, settings.WeeklyMatchDayMaxPlayersPerTeam, settings.WeeklyMatchDayAutoTeamsLeadHours, logger);
        }
    }

    /// <summary>Auto-drafts teams for every generated MatchDay now within its lead-time window.
    /// Shared by the hourly tick and the admin "Generate now" action. Returns how many MatchDays
    /// actually got teams (some may be skipped - see WeeklyMatchDayTeamGenerator.GenerateAsync).</summary>
    public static async Task<int> GenerateDueTeamsAsync(BofcDbContext db, WeeklyMatchDayTeamGenerator teamGenerator, int maxPlayersPerTeam, int leadHours, ILogger? logger = null)
    {
        var now = DateTime.Now;
        var dueMatchDayIds = await db.MatchDays
            .Where(t => t.IsWeeklyMatchDay && !t.AutoTeamsGenerated
                && t.MatchDayDate > now && t.MatchDayDate <= now.AddHours(leadHours))
            .Select(t => t.Id)
            .ToListAsync();

        var generatedCount = 0;
        foreach (var matchDayId in dueMatchDayIds)
        {
            // One MatchDay throwing (e.g. fixture generation failing after teams already
            // committed - see WeeklyMatchDayTeamGenerator's own remarks) must not abort every
            // other due MatchDay in this same tick; they'd otherwise silently wait a full extra
            // hour (or slide past their lead-time window) for something unrelated to them.
            try
            {
                if ((await teamGenerator.GenerateAsync(matchDayId, maxPlayersPerTeam)).Success)
                {
                    generatedCount++;
                }
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "Auto team generation failed for MatchDay {MatchDayId}", matchDayId);
            }
        }

        return generatedCount;
    }

    /// <summary>Creates the MatchDay for every (week, slot) pair not yet covered, for every week
    /// whose Monday falls within <paramref name="anchor"/>'s calendar month. Safe to call
    /// repeatedly - already-covered pairs are skipped. Returns the newly created MatchDays only
    /// (for the RSVP notification), not ones that already existed.</summary>
    public static async Task<List<MatchDay>> GenerateForCurrentMonthAsync(BofcDbContext db, SystemSettings settings, DateTime anchor)
    {
        var created = new List<MatchDay>();
        var monthEnd = new DateTime(anchor.Year, anchor.Month, DateTime.DaysInMonth(anchor.Year, anchor.Month));
        var weekStart = MondayOf(anchor.Date);

        while (weekStart <= monthEnd)
        {
            foreach (var slot in settings.WeeklyMatchDaySlots)
            {
                var occurrence = OccurrenceOf(weekStart, slot.DayOfWeek, slot.Time);
                if (occurrence < anchor) continue;

                var alreadyExists = await db.MatchDays.AnyAsync(t =>
                    t.IsWeeklyMatchDay && t.AutoGenSlotDayOfWeek == slot.DayOfWeek && t.AutoGenWeekStart == weekStart);
                if (alreadyExists) continue;

                // An admin manually creating a MatchDay never sets IsWeeklyMatchDay/AutoGenSlotDayOfWeek,
                // so the check above alone would let this generator create a SECOND MatchDay for the
                // same venue on the same calendar day - same event, double-booked venue, two separate
                // RSVP/notification threads. Skip generation if the venue already has any MatchDay
                // (admin-created or otherwise) that day.
                var venueAlreadyBookedThatDay = await db.MatchDays.AnyAsync(t =>
                    t.VenueId == settings.WeeklyMatchDayVenueId && t.MatchDayDate.Date == occurrence.Date);
                if (venueAlreadyBookedThatDay) continue;

                var matchDay = new MatchDay
                {
                    Name = $"{settings.WeeklyMatchDayNamePrefix} - {occurrence:MMM d, yyyy}",
                    MatchDayDate = occurrence,
                    DurationMinutes = slot.DurationMinutes,
                    TimeGapMinutes = slot.TimeGapMinutes,
                    MatchDurationMinutes = slot.MatchDurationMinutes,
                    VenueId = settings.WeeklyMatchDayVenueId!.Value,
                    MatchDayStatus = MatchDayStatus.UPCOMING,
                    IsActive = true,
                    SportType = settings.WeeklyMatchDaySportType,
                    MatchDayType = MatchDayType.ROUND_ROBIN,
                    IsWeeklyMatchDay = true,
                    AutoGenSlotDayOfWeek = slot.DayOfWeek,
                    AutoGenWeekStart = weekStart,
                };
                db.MatchDays.Add(matchDay);
                created.Add(matchDay);
            }

            weekStart = weekStart.AddDays(7);
        }

        if (created.Count > 0)
        {
            await db.SaveChangesAsync();
        }

        return created;
    }

    private static DateTime MondayOf(DateTime date)
    {
        var dayDiff = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return date.Date.AddDays(-dayDiff);
    }

    private static DateTime OccurrenceOf(DateTime weekStart, DayOfWeek targetDay, TimeSpan targetTime)
    {
        var dayDiff = ((int)targetDay - (int)DayOfWeek.Monday + 7) % 7;
        return weekStart.AddDays(dayDiff) + targetTime;
    }
}
