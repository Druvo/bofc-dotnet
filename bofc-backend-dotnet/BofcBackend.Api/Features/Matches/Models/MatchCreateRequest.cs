using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Matches.Models;

public class MatchCreateRequest
{
    [Required(ErrorMessage = "Tournament ID is required")]
    public long? TournamentId { get; set; }

    public long? RoundId { get; set; }
    public long? GroupId { get; set; }

    [Required(ErrorMessage = "Home team ID is required")]
    public long? HomeTeamId { get; set; }

    [Required(ErrorMessage = "Away team ID is required")]
    public long? AwayTeamId { get; set; }

    [Required(ErrorMessage = "Match date is required")]
    public DateTime? MatchDate { get; set; }

    public long? VenueId { get; set; }
    public int? MatchOrder { get; set; }
    public int? MatchDurationMinutes { get; set; }
    public string? GroupName { get; set; }
}
