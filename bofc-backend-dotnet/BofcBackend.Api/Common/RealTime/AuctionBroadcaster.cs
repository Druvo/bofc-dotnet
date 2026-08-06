using System.Text.Json;
using BofcBackend.Api.Common.Json;
using BofcBackend.Api.Common.RealTime.Stomp;
using BofcBackend.Api.Features.Auction.Models;

namespace BofcBackend.Api.Common.RealTime;

public class AuctionBroadcaster(AuctionStompHub hub) : IAuctionBroadcaster
{
    public Task BroadcastAsync(long matchDayId, string type, object? payload)
    {
        var message = new AuctionWebSocketMessage { Type = type, MatchDayId = matchDayId, Payload = payload };
        var json = JsonSerializer.Serialize(message, JsonDefaults.Options);
        return hub.PublishAsync($"/topic/auction/{matchDayId}", json);
    }
}
