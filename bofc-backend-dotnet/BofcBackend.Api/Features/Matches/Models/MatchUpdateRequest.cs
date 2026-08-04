using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Matches.Models;

public class MatchUpdateRequest
{
    [Required(ErrorMessage = "Match status is mandatory")]
    public string MatchStatus { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "Home team score must be zero or positive")]
    public int? HomeTeamScore { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Away team score must be zero or positive")]
    public int? AwayTeamScore { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Elapsed time must be zero or positive")]
    public int? ElapsedTimeSeconds { get; set; }
}
