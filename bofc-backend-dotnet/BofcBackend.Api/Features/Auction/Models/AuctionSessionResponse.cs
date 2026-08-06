using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionSessionResponse.java.</summary>
public class AuctionSessionResponse
{
    public long? Id { get; set; }
    public long MatchDayId { get; set; }
    public AuctionSessionStatus Status { get; set; }
    public AuctionPlayerResponse? CurrentPlayer { get; set; }
    public int? RoundNumber { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CurrentTimerEndsAt { get; set; }
    public long? RemainingSeconds { get; set; }
}
