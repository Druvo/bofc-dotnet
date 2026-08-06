using BofcBackend.Api.Features.MatchDays;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Port of service/MatchDaySchedulerService.java's @Scheduled(cron = "0 0 0,8,11 * * ?",
/// zone = "Asia/Dhaka") — runs at 00:00, 08:00, and 11:00 Dhaka time daily, calling
/// IMatchDayService.UpdateMatchDayStatusesAsync() (MatchDayService.cs, already ported
/// in the MatchDay CRUD slice).
/// </summary>
public class MatchDayStatusSchedulerBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<MatchDayStatusSchedulerBackgroundService> logger) : BackgroundService
{
    private static readonly TimeZoneInfo DhakaTimeZone = ResolveDhakaTimeZone();
    private static readonly TimeSpan[] RunTimesOfDay = [TimeSpan.Zero, TimeSpan.FromHours(8), TimeSpan.FromHours(11)];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = ComputeDelayUntilNextRun();
            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await RunOnceAsync();
        }
    }

    private async Task RunOnceAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var matchDayService = scope.ServiceProvider.GetRequiredService<IMatchDayService>();
        try
        {
            await matchDayService.UpdateMatchDayStatusesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Scheduled MatchDay status update failed");
        }
    }

    private static TimeSpan ComputeDelayUntilNextRun()
    {
        var nowUtc = DateTime.UtcNow;
        var nowDhaka = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, DhakaTimeZone);

        var candidates = new List<DateTime>();
        foreach (var offset in RunTimesOfDay)
        {
            candidates.Add(nowDhaka.Date + offset);
            candidates.Add(nowDhaka.Date.AddDays(1) + offset);
        }

        var nextDhaka = candidates.Where(t => t > nowDhaka).OrderBy(t => t).First();
        var nextUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(nextDhaka, DateTimeKind.Unspecified), DhakaTimeZone);
        var delay = nextUtc - nowUtc;
        return delay > TimeSpan.Zero ? delay : TimeSpan.FromSeconds(1);
    }

    private static TimeZoneInfo ResolveDhakaTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Dhaka"); // IANA — Linux/macOS, modern Windows (ICU)
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Bangladesh Standard Time"); // Windows legacy ID fallback
        }
    }
}
