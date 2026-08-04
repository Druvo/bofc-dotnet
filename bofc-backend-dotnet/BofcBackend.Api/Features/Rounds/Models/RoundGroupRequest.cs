using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Rounds.Models;

public class RoundGroupRequest
{
    [Required(ErrorMessage = "Round ID is required")]
    public long? RoundId { get; set; }

    public long? ParentGroupId { get; set; }

    [Required(ErrorMessage = "Group name is required")]
    public string GroupName { get; set; } = string.Empty;

    /// <summary>MANUAL, ROUND_ROBIN_SINGLE, ROUND_ROBIN_DOUBLE, CUSTOM_MULTIPLE.</summary>
    public string? GroupFormat { get; set; }

    /// <summary>JSON string.</summary>
    public string? AdvancementRule { get; set; }

    [Range(2, int.MaxValue, ErrorMessage = "Max teams must be at least 2")]
    public int? MaxTeams { get; set; }
}
