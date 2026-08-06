namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionResultResponse.java.</summary>
public class AuctionResultResponse
{
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public List<TeamSquadResponse> TeamSquads { get; set; } = [];
    public List<AuctionPlayerResponse> UnsoldPlayers { get; set; } = [];
    public AuctionStatsResponse Statistics { get; set; } = new();
}
