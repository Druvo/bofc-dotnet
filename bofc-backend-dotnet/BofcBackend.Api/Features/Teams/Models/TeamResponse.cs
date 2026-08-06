namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TeamResponse.java.</summary>
public class TeamResponse
{
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string? LogoKey { get; set; }
    public string? LogoUrl { get; set; }
    public long MatchDayId { get; set; }
    public string? MatchDayName { get; set; }
}
