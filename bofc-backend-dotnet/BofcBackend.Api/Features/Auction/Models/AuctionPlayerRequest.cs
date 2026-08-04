using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionPlayerRequest.java.</summary>
public class AuctionPlayerRequest
{
    public long? PlayerId { get; set; }
    public AuctionPlayerType? PlayerType { get; set; }
    public AuctionPlayerCategory? Category { get; set; }

    [Range(1, int.MaxValue)]
    public int? BasePrice { get; set; }

    public int? SequenceOrder { get; set; }
}
