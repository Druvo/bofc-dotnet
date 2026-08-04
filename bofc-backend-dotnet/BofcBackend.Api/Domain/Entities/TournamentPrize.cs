using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/TournamentPrize.java.</summary>
public class TournamentPrize : AuditableEntity
{
    public long Id { get; set; }

    public long TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;

    public PrizeType PrizeType { get; set; }

    public long? TeamId { get; set; }
    public Team? Team { get; set; }

    public long? PlayerId { get; set; }
    public Player? Player { get; set; }

    public int PositionRank { get; set; }
    public decimal? PrizeAmount { get; set; }
    public PrizeCategory PrizeCategory { get; set; }
    public string? Description { get; set; }
    public string? ImageLinks { get; set; }
}
