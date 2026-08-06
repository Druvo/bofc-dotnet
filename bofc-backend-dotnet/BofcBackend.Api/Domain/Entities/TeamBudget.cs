namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/auction/TeamBudget.java.</summary>
public class TeamBudget : AuditableEntity
{
    public long Id { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public long TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public long OwnerId { get; set; }
    public Player Owner { get; set; } = null!;

    public int TotalBudget { get; set; }
    public int RemainingBudget { get; set; }
    public int TotalSpent { get; set; }
    public int PlayersBought { get; set; }

    /// <summary>Optimistic-concurrency token (Java's @Version) — not the pessimistic FOR UPDATE lock used during bidding.</summary>
    public int Version { get; set; }
}
