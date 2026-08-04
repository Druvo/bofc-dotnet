using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/auction/AuctionSession.java.</summary>
public class AuctionSession : AuditableEntity
{
    public long Id { get; set; }

    public long TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;

    public AuctionSessionStatus Status { get; set; }

    public long? CurrentAuctionPlayerId { get; set; }
    public AuctionPlayer? CurrentAuctionPlayer { get; set; }

    public int RoundNumber { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? PausedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CurrentTimerEndsAt { get; set; }
}
