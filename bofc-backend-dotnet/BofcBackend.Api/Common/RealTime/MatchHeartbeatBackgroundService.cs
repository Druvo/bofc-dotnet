namespace BofcBackend.Api.Common.RealTime;

/// <summary>Port of LiveMatchUpdatePublisher.java's @Scheduled(fixedRate = 30, SECONDS) heartbeat.</summary>
public class MatchHeartbeatBackgroundService(ILiveMatchUpdatePublisher publisher) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            publisher.SendHeartbeat();
        }
    }
}
