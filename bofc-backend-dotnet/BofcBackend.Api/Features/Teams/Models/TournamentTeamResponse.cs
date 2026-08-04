namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TournamentTeamResponse.java.</summary>
public class TournamentTeamResponse
{
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string? LogoKey { get; set; }
    public string? LogoUrl { get; set; }
    public List<TeamPlayerResponse> Players { get; set; } = [];
}
