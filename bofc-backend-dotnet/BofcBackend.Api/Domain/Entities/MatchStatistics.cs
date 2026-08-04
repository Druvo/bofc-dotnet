namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/MatchStatistics.java.</summary>
public class MatchStatistics : AuditableEntity
{
    public long Id { get; set; }

    public long MatchId { get; set; }
    public Match Match { get; set; } = null!;

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public long TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public int GoalsScored { get; set; }
    public int Assists { get; set; }
    public int RedCards { get; set; }
    public int YellowCards { get; set; }
    public int SubstitutionIn { get; set; }
    public int SubstitutionOut { get; set; }
    public int MinutesPlayed { get; set; }
}
