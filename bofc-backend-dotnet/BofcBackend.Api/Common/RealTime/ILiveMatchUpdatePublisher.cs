using System.Threading.Channels;

namespace BofcBackend.Api.Common.RealTime;

/// <summary>Port of service/LiveMatchUpdatePublisher.java — SSE (not the auction's WebSocket/STOMP), per-tournament fan-out.</summary>
public interface ILiveMatchUpdatePublisher
{
    (Guid SubscriptionId, ChannelReader<string> Frames) Subscribe(long tournamentId);
    void Unsubscribe(long tournamentId, Guid subscriptionId);
    void PublishMatchUpdate(long? tournamentId, long? matchId, string eventType);

    /// <summary>Pings every open connection so dead clients get pruned instead of accumulating (called by a background service every 30s).</summary>
    void SendHeartbeat();
}
