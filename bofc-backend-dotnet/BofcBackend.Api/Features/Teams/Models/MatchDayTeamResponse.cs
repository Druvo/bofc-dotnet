namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/MatchDayTeamResponse.java.</summary>
public class MatchDayTeamResponse
{
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string? LogoKey { get; set; }
    public string? LogoUrl { get; set; }
    public List<TeamPlayerResponse> Players { get; set; } = [];
}
