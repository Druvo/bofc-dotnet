namespace BofcBackend.Api.Features.Players.Models;

/// <summary>Body for the admin "pause / resume this player" toggle - see Player.IsPaused.</summary>
public class PlayerPausedRequest
{
    public bool Paused { get; set; }
}
