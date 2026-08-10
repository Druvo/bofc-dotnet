namespace BofcBackend.Api.Common.RealTime.Stomp;

/// <summary>
/// Port of config/WebSocketConfig.java's registry.addEndpoint("/ws/auction").withSockJS() -
/// hand-rolled since ASP.NET Core has no built-in SockJS+STOMP server and the frontend's
/// useAuctionWebSocket hook (@stomp/stompjs + sockjs-client) speaks that exact wire protocol,
/// not SignalR's. Only the "websocket" SockJS transport is implemented (see SockJsFraming) -
/// sufficient because sockjs-client always prefers it when the browser supports raw WebSocket.
/// </summary>
public static class SockJsStompEndpoints
{
    public static void MapAuctionSockJsStomp(this WebApplication app, string prefix)
    {
        app.MapGet($"{prefix}/info", () => Results.Json(new
        {
            websocket = true,
            origins = new[] { "*:*" },
            cookie_needed = false,
            entropy = Random.Shared.Next(),
        }));

        app.Map($"{prefix}/{{server}}/{{session}}/websocket", async (HttpContext context, AuctionStompHub hub) =>
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                return;
            }

            using var socket = await context.WebSockets.AcceptWebSocketAsync();
            var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("AuctionStomp");
            var connection = new StompConnection(socket, hub, logger);
            await connection.RunAsync(context.RequestAborted);
        });
    }
}
