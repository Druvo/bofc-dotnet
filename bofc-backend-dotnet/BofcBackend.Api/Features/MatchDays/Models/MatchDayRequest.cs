using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.MatchDays.Models;

public class MatchDayRequest
{
    public string? MatchDayName { get; set; }
    public string? Title { get; set; }
    public string? Season { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? RoadmapImageUrl { get; set; }

    [Required(ErrorMessage = "MatchDay date is mandatory")]
    public DateTime? MatchDayDate { get; set; }

    /// <summary>How long the MatchDay runs, in minutes — drives the derived ONGOING/CONCLUDED window. Null = unknown, client falls back to a default.</summary>
    public int? DurationMinutes { get; set; }

    [Required(ErrorMessage = "Venue ID is mandatory")]
    public long? VenueId { get; set; }

    public string? SportType { get; set; }
    public string? MatchDayType { get; set; }
    public int? GroupCount { get; set; }
    public bool AuctionMode { get; set; }
    public bool? DefaultMatchDay { get; set; }
}
