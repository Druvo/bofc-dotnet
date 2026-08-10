namespace BofcBackend.Api.Domain.Enums;

/// <summary>A player's fitness for a specific team lineup selection - distinct from the
/// unrelated <see cref="AvailabilityStatus"/> (an auction sign-up field).</summary>
public enum PlayerAvailability
{
    FIT,
    DOUBTFUL,
    INJURED,
}
