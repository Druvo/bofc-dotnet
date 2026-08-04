namespace BofcBackend.Api.Features.Statistics.Models;

public class MatchStatisticsResponse
{
    public long Id { get; set; }
    public long MatchId { get; set; }
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int GoalsScored { get; set; }
    public int Assists { get; set; }
    public int RedCards { get; set; }
    public int YellowCards { get; set; }
    public int SubstitutionIn { get; set; }
    public int SubstitutionOut { get; set; }
    public int MinutesPlayed { get; set; }
}
