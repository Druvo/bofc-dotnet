using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Tournaments.Models;

public class TournamentRequest
{
    public string? TournamentName { get; set; }
    public string? Title { get; set; }
    public string? Season { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? RoadmapImageUrl { get; set; }

    [Required(ErrorMessage = "Tournament date is mandatory")]
    public DateTime? TournamentDate { get; set; }

    [Required(ErrorMessage = "Venue ID is mandatory")]
    public long? VenueId { get; set; }

    public string? SportType { get; set; }
    public string? TournamentType { get; set; }
    public int? GroupCount { get; set; }
    public bool AuctionMode { get; set; }
    public bool? DefaultTournament { get; set; }
}
