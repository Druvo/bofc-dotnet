namespace BofcBackend.Api.Features.Rounds.Models;

public class GroupStandingResponse
{
    public long Id { get; set; }
    public long GroupId { get; set; }
    public string? GroupName { get; set; }
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int MatchesPlayed { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }
    public int GoalDifference { get; set; }
    public int Points { get; set; }
    public int YellowCards { get; set; }
    public int RedCards { get; set; }
    public int FairPlayPoints { get; set; }
    public int? TiebreakRank { get; set; }
    public int? Position { get; set; }
    public bool IsAdvanced { get; set; }
}
