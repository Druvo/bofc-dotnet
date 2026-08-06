namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/Team.java.</summary>
public class Team : AuditableEntity
{
    public long Id { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string? LogoKey { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
}
