using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Matches.Models;

public class MatchCreateRequest
{
    [Required(ErrorMessage = "MatchDay ID is required")]
    public long? MatchDayId { get; set; }

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

    /// <summary>Which of the club's 2 physical jerseys each side wears - optional, set manually per match.</summary>
    public string? HomeJerseyColor { get; set; }
    public string? AwayJerseyColor { get; set; }
}
