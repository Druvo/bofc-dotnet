namespace BofcBackend.Api.Features.Statistics.Models;

public class TournamentTopScorerResponse
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public int GoalsScored { get; set; }
    public int Assists { get; set; }
    public int MatchesPlayed { get; set; }
}
