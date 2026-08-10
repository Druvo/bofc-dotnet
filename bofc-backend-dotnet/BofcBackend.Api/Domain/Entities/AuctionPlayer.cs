using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/auction/AuctionPlayer.java.</summary>
public class AuctionPlayer : AuditableEntity
{
    public long Id { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public AuctionPlayerType PlayerType { get; set; }
    public AuctionPlayerCategory? Category { get; set; }
    public int BasePrice { get; set; }
    public int? CurrentBid { get; set; }

    public long? CurrentHighestTeamId { get; set; }
    public Team? CurrentHighestTeam { get; set; }

    public long? SoldToTeamId { get; set; }
    public Team? SoldToTeam { get; set; }

    public int? FinalPrice { get; set; }
    public AuctionPlayerStatus Status { get; set; }
    public int AuctionRound { get; set; }
    public decimal? PlayerRating { get; set; }
    public int? SequenceOrder { get; set; }

    /// <summary>Optimistic-concurrency token (Java's @Version) - not the pessimistic FOR UPDATE lock used for bids/budget.</summary>
    public int Version { get; set; }
}
