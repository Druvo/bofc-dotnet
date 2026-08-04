namespace BofcBackend.Api.Common.RealTime;

/// <summary>Port of AuctionSessionServiceImpl.broadcastState — publishes to /topic/auction/{tournamentId}.</summary>
public interface IAuctionBroadcaster
{
    Task BroadcastAsync(long tournamentId, string type, object? payload);
}
