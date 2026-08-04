using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Rounds.Models;

public class PlaceholderTeamRequest
{
    /// <summary>For group-based rounds.</summary>
    public long? GroupId { get; set; }

    /// <summary>For direct knockout rounds.</summary>
    public long? RoundId { get; set; }

    [Required(ErrorMessage = "Placeholder name is required")]
    public string PlaceholderName { get; set; } = string.Empty;

    /// <summary>JSON string describing where the team will come from.</summary>
    public string? SourceRule { get; set; }

    public int? SeedPosition { get; set; }
}
