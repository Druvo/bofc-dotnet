using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Prizes.Models;

public class MatchDayPrizeRequest
{
    public long MatchDayId { get; set; }

    [Required(ErrorMessage = "Prize type is required")]
    public PrizeType? PrizeType { get; set; }

    // One of these must be provided based on PrizeType.
    public long? TeamId { get; set; }
    public long? PlayerId { get; set; }

    [Required(ErrorMessage = "Position rank is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Position rank must be at least 1")]
    public int? PositionRank { get; set; }

    public decimal? PrizeAmount { get; set; }

    [Required(ErrorMessage = "Prize category is required")]
    public PrizeCategory? PrizeCategory { get; set; }

    public string? Description { get; set; }
    public List<string>? ImageLinks { get; set; }
}
