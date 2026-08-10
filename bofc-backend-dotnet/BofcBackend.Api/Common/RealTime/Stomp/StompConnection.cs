using System.Net.WebSockets;
using System.Text;

namespace BofcBackend.Api.Common.RealTime.Stomp;

/// <summary>
/// One client's SockJS+STOMP session over a single raw WebSocket. Handles the STOMP subset this
/// app actually needs: CONNECT -> CONNECTED, SUBSCRIBE/UNSUBSCRIBE, DISCONNECT, and periodic
/// heartbeats. There is no SEND handling - this app only ever pushes server -> client (auction
/// broadcasts); bids are placed over the regular REST API, matching the Java server's actual
/// STOMP usage (it never received client SEND frames either, only used SimpMessagingTemplate to
/// push).
/// </summary>
public class StompConnection(WebSocket socket, AuctionStompHub hub, ILogger logger)
{
    private readonly Dictionary<string, string> _subscriptions = new(); // subId -> destination
    private readonly CancellationTokenSource _cts = new();

    public async Task RunAsync(CancellationToken hostCancellation)
    {
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(hostCancellation, _cts.Token);
        var heartbeatTask = HeartbeatLoopAsync(linked.Token);

        try
        {
            await SendRawAsync(SockJsFraming.OpenFrame, linked.Token);
            await ReadLoopAsync(linked.Token);
        }
        catch (OperationCanceledException)
        {
            // normal shutdown
        }
        catch (WebSocketException)
        {
            // client disconnected without a clean close handshake
        }
        finally
        {
            await _cts.CancelAsync();
            foreach (var destination in _subscriptions.Values.Distinct())
            {
                hub.Unsubscribe(destination, this);
            }

            try
            {
                await heartbeatTask;
            }
            catch
            {
                // best-effort
            }
        }
    }

    private async Task ReadLoopAsync(CancellationToken ct)
    {
        var buffer = new byte[8192];
        var messageBuffer = new List<byte>();

        while (!ct.IsCancellationRequested && socket.State == WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(buffer, ct);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, null, ct);
                return;
            }

            messageBuffer.AddRange(buffer[..result.Count]);
            if (!result.EndOfMessage)
            {
                continue;
            }

            var text = Encoding.UTF8.GetString(messageBuffer.ToArray());
            messageBuffer.Clear();
            await HandleClientFrameAsync(text, ct);
        }
    }

    private async Task HandleClientFrameAsync(string sockJsPayload, CancellationToken ct)
    {
        foreach (var rawStompFrame in SockJsFraming.DecodeClientFrame(sockJsPayload))
        {
            if (string.IsNullOrWhiteSpace(rawStompFrame))
            {
                continue; // client heartbeat
            }

            var frame = StompFrame.Parse(rawStompFrame);
            switch (frame.Command)
            {
                case "CONNECT":
                case "STOMP":
                    await SendFrameAsync(new StompFrame
                    {
                        Command = "CONNECTED",
                        Headers = { ["version"] = "1.2", ["heart-beat"] = "4000,4000" },
                    }, ct);
                    break;

                case "SUBSCRIBE":
                    if (frame.Headers.TryGetValue("id", out var subId) && frame.Headers.TryGetValue("destination", out var destination))
                    {
                        _subscriptions[subId] = destination;
                        hub.Subscribe(destination, this);
                    }

                    break;

                case "UNSUBSCRIBE":
                    if (frame.Headers.TryGetValue("id", out var unsubId) && _subscriptions.TryGetValue(unsubId, out var unsubDestination))
                    {
                        hub.Unsubscribe(unsubDestination, this);
                        _subscriptions.Remove(unsubId);
                    }

                    break;

                case "DISCONNECT":
                    await _cts.CancelAsync();
                    break;

                default:
                    logger.LogDebug("Ignoring unhandled STOMP command {Command}", frame.Command);
                    break;
            }
        }
    }

    /// <summary>Pushes a MESSAGE frame to this connection for the given subscription's destination.</summary>
    public async Task SendMessageAsync(string destination, string subscriptionId, string jsonBody, CancellationToken ct)
    {
        await SendFrameAsync(new StompFrame
        {
            Command = "MESSAGE",
            Headers =
            {
                ["destination"] = destination,
                ["subscription"] = subscriptionId,
                ["message-id"] = Guid.NewGuid().ToString("N"),
                ["content-type"] = "application/json",
            },
            Body = jsonBody,
        }, ct);
    }

    public string? SubscriptionIdFor(string destination) =>
        _subscriptions.FirstOrDefault(kv => kv.Value == destination).Key;

    private async Task SendFrameAsync(StompFrame frame, CancellationToken ct) =>
        await SendRawAsync(SockJsFraming.EncodeDataFrame([frame.Serialize()]), ct);

    private async Task SendRawAsync(string text, CancellationToken ct)
    {
        if (socket.State != WebSocketState.Open)
        {
            return;
        }

        var bytes = Encoding.UTF8.GetBytes(text);
        await socket.SendAsync(bytes, WebSocketMessageType.Text, true, ct);
    }

    private async Task HeartbeatLoopAsync(CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(4), ct);
                await SendRawAsync(SockJsFraming.EncodeDataFrame(["\n"]), ct);
            }
        }
        catch (OperationCanceledException)
        {
            // normal shutdown
        }
    }
}
