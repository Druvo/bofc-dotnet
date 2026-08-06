using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Rounds.Models;

public class MatchDayRoundRequest
{
    [Required(ErrorMessage = "MatchDay ID is required")]
    public long? MatchDayId { get; set; }

    [Required(ErrorMessage = "Round number is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Round number must be at least 1")]
    public int? RoundNumber { get; set; }

    [Required(ErrorMessage = "Round name is required")]
    public string RoundName { get; set; } = string.Empty;

    /// <summary>GROUP_BASED or DIRECT_KNOCKOUT.</summary>
    [Required(ErrorMessage = "Round type is required")]
    public string RoundType { get; set; } = string.Empty;

    /// <summary>JSON string.</summary>
    public string? AdvancementRule { get; set; }

    [Required(ErrorMessage = "Sequence order is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Sequence order must be at least 1")]
    public int? SequenceOrder { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
