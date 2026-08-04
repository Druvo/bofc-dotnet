namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/Team.java.</summary>
public class Team : AuditableEntity
{
    public long Id { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string? LogoKey { get; set; }

    public long TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;

    public ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
}
