using System.Collections.Concurrent;

namespace BofcBackend.Api.Common.RealTime.Stomp;

/// <summary>
/// Tracks which live STOMP connections are subscribed to which destination ("/topic/auction/{id}")
/// and fans out published messages to them. Port of Spring's SimpMessagingTemplate.convertAndSend
/// for this app's one topic pattern — registered as a singleton so AuctionSessionService can
/// publish without knowing about individual WebSocket connections.
/// </summary>
public class AuctionStompHub(ILogger<AuctionStompHub> logger)
{
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<StompConnection, byte>> _subscribers = new();

    public void Subscribe(string destination, StompConnection connection)
    {
        var set = _subscribers.GetOrAdd(destination, _ => new ConcurrentDictionary<StompConnection, byte>());
        set[connection] = 0;
    }

    public void Unsubscribe(string destination, StompConnection connection)
    {
        if (_subscribers.TryGetValue(destination, out var set))
        {
            set.TryRemove(connection, out _);
        }
    }

    public async Task PublishAsync(string destination, string jsonBody)
    {
        if (!_subscribers.TryGetValue(destination, out var set) || set.IsEmpty)
        {
            return;
        }

        foreach (var connection in set.Keys)
        {
            var subscriptionId = connection.SubscriptionIdFor(destination);
            if (subscriptionId == null)
            {
                continue;
            }

            try
            {
                await connection.SendMessageAsync(destination, subscriptionId, jsonBody, CancellationToken.None);
            }
            catch (Exception e)
            {
                logger.LogWarning(e, "Failed to push STOMP message to a subscriber of {Destination}", destination);
            }
        }
    }
}
