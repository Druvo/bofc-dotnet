using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/ApproveAndPoolRequest.java.</summary>
public class ApproveAndPoolRequest
{
    public AuctionPlayerCategory? Category { get; set; }
    public int? BasePrice { get; set; }
}
