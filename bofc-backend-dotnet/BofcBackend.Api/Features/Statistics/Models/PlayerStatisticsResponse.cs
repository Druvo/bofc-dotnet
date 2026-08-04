namespace BofcBackend.Api.Features.Statistics.Models;

public class PlayerStatisticsResponse
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public StatisticsSummary Statistics { get; set; } = new();

    public class StatisticsSummary
    {
        public int MatchesPlayed { get; set; }
        public int GoalsScored { get; set; }
        public int Assists { get; set; }
        public int GoalsAndAssists { get; set; }
        public int YellowCards { get; set; }
        public int RedCards { get; set; }
    }
}
