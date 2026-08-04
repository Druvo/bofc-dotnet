using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/TeamPlayer.java.</summary>
public class TeamPlayer : AuditableEntity
{
    public long Id { get; set; }

    public long TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public FootballPosition PlayingPosition { get; set; }
    public TeamPlayerRole TeamPlayerRole { get; set; }
    public bool IsCaptain { get; set; }
    public int? JerseyNumber { get; set; }
}
