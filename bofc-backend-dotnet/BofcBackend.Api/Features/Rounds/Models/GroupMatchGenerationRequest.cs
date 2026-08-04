using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Rounds.Models;

public class GroupMatchGenerationRequest
{
    [Required(ErrorMessage = "Start date is required")]
    public DateTime? StartDate { get; set; }

    [Required(ErrorMessage = "Fixture format is required")]
    public FixtureFormat? FixtureFormat { get; set; }

    /// <summary>Minutes between matches. Default: 180 (3 hours).</summary>
    public int? MatchTimeGapMinutes { get; set; }

    /// <summary>Default: 90 minutes.</summary>
    public int? MatchDurationMinutes { get; set; }

    public long? VenueId { get; set; }
}
