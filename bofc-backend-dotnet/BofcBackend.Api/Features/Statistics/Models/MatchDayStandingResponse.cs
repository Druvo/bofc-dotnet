namespace BofcBackend.Api.Features.Statistics.Models;

public class MatchDayStandingResponse
{
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int Points { get; set; }
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }
    public int Matches { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int GoalDifference { get; set; }
}
