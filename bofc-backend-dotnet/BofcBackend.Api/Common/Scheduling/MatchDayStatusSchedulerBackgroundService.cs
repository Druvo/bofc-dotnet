using BofcBackend.Api.Data;
using BofcBackend.Api.Features.MatchDays;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Runs IMatchDayService.UpdateMatchDayStatusesAsync() (MatchDayService.cs) on a repeating
/// interval - fires immediately on startup, then waits SystemSettings.MatchDayStatusCheckIntervalHours
/// before the next run. That setting is re-read every cycle (not just once at startup), so an
/// admin changing it in Settings takes effect after the current wait finishes - no restart needed.
/// </summary>
public class MatchDayStatusSchedulerBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<MatchDayStatusSchedulerBackgroundService> logger) : BackgroundService
{
    /// <summary>Used when the configured interval cannot be read, and as the floor for it.</summary>
    private const int DefaultIntervalHours = 1;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            int intervalHours;
            try
            {
                intervalHours = await RunOnceAsync();
            }
            catch (Exception ex)
            {
                // RunOnceAsync guards the status update itself, but not the settings read that
                // precedes it - and an unhandled exception out of ExecuteAsync stops the entire
                // host, because that is what BackgroundServiceExceptionBehavior does by default.
                // So a database blip during that one read took the whole API down rather than
                // costing a single scheduler tick, which is the opposite of the trade the other
                // three schedulers in this folder make. Retry on the default interval instead.
                logger.LogError(ex, "MatchDay status scheduler run failed; retrying in {IntervalHours}h", DefaultIntervalHours);
                intervalHours = DefaultIntervalHours;
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    /// <summary>Returns the interval to wait before the next run, read fresh from settings.</summary>
    private async Task<int> RunOnceAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BofcDbContext>();
        var matchDayService = scope.ServiceProvider.GetRequiredService<IMatchDayService>();

        var intervalHours = await db.SystemSettings.AsNoTracking()
            .Select(s => s.MatchDayStatusCheckIntervalHours)
            .FirstOrDefaultAsync();
        if (intervalHours < DefaultIntervalHours)
        {
            intervalHours = DefaultIntervalHours;
        }

        try
        {
            await matchDayService.UpdateMatchDayStatusesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Scheduled MatchDay status update failed");
        }

        return intervalHours;
    }
}
