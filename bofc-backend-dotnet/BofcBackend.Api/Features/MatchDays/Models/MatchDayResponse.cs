using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.MatchDays.Models;

public class MatchDayResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Season { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? RoadmapImageUrl { get; set; }
    public DateTime MatchDayDate { get; set; }

    /// <summary>How long the MatchDay runs, in minutes — null if not set when created.</summary>
    public int? DurationMinutes { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public string? VenueMapLink { get; set; }
    public bool ActiveStatus { get; set; }
    public bool DefaultMatchDay { get; set; }
    public MatchDayStatus MatchDayStatus { get; set; }
    public string? SportType { get; set; }
    public string? MatchDayType { get; set; }
    public int? GroupCount { get; set; }
    public bool AuctionMode { get; set; }
    public bool IsWeeklyMatchDay { get; set; }
}
