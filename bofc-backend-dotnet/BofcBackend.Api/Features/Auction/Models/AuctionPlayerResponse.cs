using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionPlayerResponse.java.</summary>
public class AuctionPlayerResponse
{
    public long Id { get; set; }
    public long TournamentId { get; set; }
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string? PlayerEmail { get; set; }
    public string? PhotoUrl { get; set; }
    public FootballPosition PlayingPosition { get; set; }
    public AuctionPlayerType PlayerType { get; set; }
    public AuctionPlayerCategory? Category { get; set; }
    public int BasePrice { get; set; }
    public int? CurrentBid { get; set; }
    public long? CurrentHighestTeamId { get; set; }
    public string? CurrentHighestTeamName { get; set; }
    public long? SoldToTeamId { get; set; }
    public string? SoldToTeamName { get; set; }
    public int? FinalPrice { get; set; }
    public AuctionPlayerStatus Status { get; set; }
    public int? AuctionRound { get; set; }
    public decimal? PlayerRating { get; set; }
    public int? SequenceOrder { get; set; }
}
