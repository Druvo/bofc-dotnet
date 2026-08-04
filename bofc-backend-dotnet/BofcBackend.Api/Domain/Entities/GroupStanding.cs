namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/GroupStanding.java.</summary>
public class GroupStanding : AuditableEntity
{
    public long Id { get; set; }

    public long GroupId { get; set; }
    public RoundGroup Group { get; set; } = null!;

    public long TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public int MatchesPlayed { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }
    public int GoalDifference { get; set; }
    public int Points { get; set; }
    public int YellowCards { get; set; }
    public int RedCards { get; set; }

    /// <summary>
    /// UEFA deduction model (lower is better): yellow = -1, second yellow (indirect red) = -3,
    /// direct red = -4, yellow + direct red = -5.
    /// </summary>
    public int FairPlayPoints { get; set; }

    /// <summary>Manually-recorded penalty-shootout tiebreak order; lower ranks higher, null = unset.</summary>
    public int? TiebreakRank { get; set; }

    public int? Position { get; set; }
    public bool IsAdvanced { get; set; }
}
