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
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var intervalHours = await RunOnceAsync();
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
        if (intervalHours < 1)
        {
            intervalHours = 1;
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
