namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/auction/AuctionBid.java.</summary>
public class AuctionBid : AuditableEntity
{
    public long Id { get; set; }

    public long AuctionSessionId { get; set; }
    public AuctionSession AuctionSession { get; set; } = null!;

    public long TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;

    public long AuctionPlayerId { get; set; }
    public AuctionPlayer AuctionPlayer { get; set; } = null!;

    public long TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public long BidderUserId { get; set; }
    public Player BidderUser { get; set; } = null!;

    public int BidAmount { get; set; }
    public DateTime BidTime { get; set; }
    public bool IsWinning { get; set; }
}
