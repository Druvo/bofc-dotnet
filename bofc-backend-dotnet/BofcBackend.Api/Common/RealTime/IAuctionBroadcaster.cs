namespace BofcBackend.Api.Common.RealTime;

/// <summary>Port of AuctionSessionServiceImpl.broadcastState - publishes to /topic/auction/{matchDayId}.</summary>
public interface IAuctionBroadcaster
{
    Task BroadcastAsync(long matchDayId, string type, object? payload);
}
