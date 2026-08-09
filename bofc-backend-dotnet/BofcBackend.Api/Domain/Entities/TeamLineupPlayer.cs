using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>One player's slot within a <see cref="TeamLineup"/> — either a starter
/// (OrderIndex = pitch slot order, 0 = goalkeeper) or a bench player (OrderIndex =
/// display order in the bench list).</summary>
public class TeamLineupPlayer : AuditableEntity
{
    public long Id { get; set; }

    public long TeamLineupId { get; set; }
    public TeamLineup TeamLineup { get; set; } = null!;

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public bool IsStarter { get; set; }
    public int OrderIndex { get; set; }
    public PlayerAvailability Availability { get; set; } = PlayerAvailability.FIT;
}
