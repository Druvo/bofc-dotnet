using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Auction;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Port of schedules/AuctionTimerScheduler.java's @Scheduled(fixedDelay = 1000). Checks every
/// second for auction timers that have expired; when one has, clears the timer and broadcasts
/// TIMER_EXPIRED. The admin must still manually mark sold/unsold — no auto-resolution.
/// </summary>
public class AuctionTimerBackgroundService(IServiceScopeFactory scopeFactory, ILogger<AuctionTimerBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await CheckExpiredAuctionTimersAsync(stoppingToken);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error in auction timer scheduler");
            }
        }
    }

    private async Task CheckExpiredAuctionTimersAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BofcDbContext>();
        var sessionService = scope.ServiceProvider.GetRequiredService<AuctionSessionService>();

        var activeSessions = await db.AuctionSessions
            .Where(s => s.Status == AuctionSessionStatus.RUNNING && s.CurrentTimerEndsAt != null)
            .ToListAsync(ct);

        foreach (var session in activeSessions)
        {
            if (session.CurrentAuctionPlayerId != null
                && session.CurrentTimerEndsAt != null
                && DateTime.Now > session.CurrentTimerEndsAt)
            {
                try
                {
                    await sessionService.NotifyTimerExpiredAsync(session.TournamentId);
                }
                catch (Exception e)
                {
                    logger.LogError(e, "Failed to notify timer expiry for tournament {TournamentId}", session.TournamentId);
                }
            }
        }
    }
}
