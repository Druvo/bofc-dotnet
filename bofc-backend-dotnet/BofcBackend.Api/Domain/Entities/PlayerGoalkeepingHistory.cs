namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/PlayerGoalkeepingHistory.java.</summary>
public class PlayerGoalkeepingHistory : AuditableEntity
{
    public long Id { get; set; }

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    /// <summary>Goalkeeping-specific round counter.</summary>
    public int RoundNumber { get; set; }

    public DateTime PlayedDate { get; set; }
}
