using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Tournaments.Models;

public class TournamentResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Season { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? RoadmapImageUrl { get; set; }
    public DateTime TournamentDate { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public string? VenueMapLink { get; set; }
    public bool ActiveStatus { get; set; }
    public bool DefaultTournament { get; set; }
    public TournamentStatus TournamentStatus { get; set; }
    public string? SportType { get; set; }
    public string? TournamentType { get; set; }
    public int? GroupCount { get; set; }
    public bool AuctionMode { get; set; }
}
