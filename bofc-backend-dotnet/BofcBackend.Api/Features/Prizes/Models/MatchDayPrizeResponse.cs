using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Prizes.Models;

public class MatchDayPrizeResponse
{
    public long Id { get; set; }
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public PrizeType PrizeType { get; set; }

    public long? TeamId { get; set; }
    public string? TeamName { get; set; }

    public long? PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public string? PlayerEmployeeId { get; set; }

    public int PositionRank { get; set; }
    public decimal? PrizeAmount { get; set; }
    public PrizeCategory PrizeCategory { get; set; }
    public string? Description { get; set; }
    public List<string> ImageLinks { get; set; } = new();

    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
