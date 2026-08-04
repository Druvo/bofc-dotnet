using System.Text;
using BofcBackend.Api.Common.RealTime;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Matches;

/// <summary>Port of controller/LiveMatchStreamController.java — Server-Sent Events, not WebSocket.</summary>
[ApiController]
[Route("matches/live")]
[AllowAnonymous]
public class LiveMatchStreamController(ILiveMatchUpdatePublisher publisher) : ControllerBase
{
    [HttpGet("tournaments/{tournamentId}/stream")]
    public async Task StreamTournamentMatchUpdates(long tournamentId, CancellationToken cancellationToken)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no"; // disable nginx response buffering in front of this proxy
        await Response.Body.FlushAsync(cancellationToken);

        var (subscriptionId, frames) = publisher.Subscribe(tournamentId);
        try
        {
            await foreach (var frame in frames.ReadAllAsync(cancellationToken))
            {
                await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(frame), cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected — expected, not an error.
        }
        finally
        {
            publisher.Unsubscribe(tournamentId, subscriptionId);
        }
    }
}
