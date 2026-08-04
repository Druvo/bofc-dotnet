using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;
using BofcBackend.Api.Common.Json;

namespace BofcBackend.Api.Common.RealTime;

public class LiveMatchUpdatePublisher : ILiveMatchUpdatePublisher
{
    private const string EventName = "match-update";
    private const string HeartbeatEventName = "heartbeat";

    private readonly ConcurrentDictionary<long, ConcurrentDictionary<Guid, Channel<string>>> _subscribers = new();

    public (Guid SubscriptionId, ChannelReader<string> Frames) Subscribe(long tournamentId)
    {
        var channel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions { SingleReader = true });
        var id = Guid.NewGuid();
        var bucket = _subscribers.GetOrAdd(tournamentId, _ => new ConcurrentDictionary<Guid, Channel<string>>());
        bucket[id] = channel;

        var initial = new LiveMatchUpdateEvent { TournamentId = tournamentId, EventType = "CONNECTED", Timestamp = NowMillis() };
        channel.Writer.TryWrite(FormatEvent(EventName, initial.Timestamp.ToString(), initial));

        return (id, channel.Reader);
    }

    public void Unsubscribe(long tournamentId, Guid subscriptionId)
    {
        if (!_subscribers.TryGetValue(tournamentId, out var bucket))
        {
            return;
        }
        if (bucket.TryRemove(subscriptionId, out var channel))
        {
            channel.Writer.TryComplete();
        }
        if (bucket.IsEmpty)
        {
            _subscribers.TryRemove(tournamentId, out _);
        }
    }

    public void PublishMatchUpdate(long? tournamentId, long? matchId, string eventType)
    {
        if (tournamentId is null || !_subscribers.TryGetValue(tournamentId.Value, out var bucket) || bucket.IsEmpty)
        {
            return;
        }

        var payload = new LiveMatchUpdateEvent
        {
            TournamentId = tournamentId.Value,
            MatchId = matchId,
            EventType = eventType,
            Timestamp = NowMillis(),
        };
        var frame = FormatEvent(EventName, payload.Timestamp.ToString(), payload);

        foreach (var (id, channel) in bucket)
        {
            if (!channel.Writer.TryWrite(frame))
            {
                Unsubscribe(tournamentId.Value, id);
            }
        }
    }

    public void SendHeartbeat()
    {
        if (_subscribers.IsEmpty)
        {
            return;
        }

        var frame = FormatComment(HeartbeatEventName, "ping");
        foreach (var (tournamentId, bucket) in _subscribers)
        {
            foreach (var (id, channel) in bucket)
            {
                if (!channel.Writer.TryWrite(frame))
                {
                    Unsubscribe(tournamentId, id);
                }
            }
        }
    }

    private static string FormatEvent(string eventName, string id, object payload)
    {
        var json = JsonSerializer.Serialize(payload, JsonDefaults.Options);
        return new StringBuilder()
            .Append("event: ").Append(eventName).Append('\n')
            .Append("id: ").Append(id).Append('\n')
            .Append("data: ").Append(json).Append('\n')
            .Append('\n')
            .ToString();
    }

    private static string FormatComment(string eventName, string comment) =>
        new StringBuilder()
            .Append("event: ").Append(eventName).Append('\n')
            .Append(": ").Append(comment).Append('\n')
            .Append('\n')
            .ToString();

    private static long NowMillis() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}
