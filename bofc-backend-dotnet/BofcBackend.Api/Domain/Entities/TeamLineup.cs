namespace BofcBackend.Api.Domain.Entities;

/// <summary>A team's starting XI + bench for the MatchDay it belongs to (one lineup per
/// team, not per individual fixture — see design_handoff_squad_lineup for the feature spec).</summary>
public class TeamLineup : AuditableEntity
{
    public long Id { get; set; }

    public long TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public int SquadSize { get; set; }
    public string Formation { get; set; } = string.Empty;

    public ICollection<TeamLineupPlayer> LineupPlayers { get; set; } = new List<TeamLineupPlayer>();
}
