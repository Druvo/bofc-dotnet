namespace BofcBackend.Api.Features.Statistics.Models;

public class PlayerMatchHistoryResponse
{
    public long MatchId { get; set; }
    public DateTime MatchDate { get; set; }
    public string? MatchDayName { get; set; }

    public long? TeamId { get; set; }
    public string? TeamName { get; set; }
    public string? OpponentTeamName { get; set; }

    public int TeamScore { get; set; }
    public int OpponentScore { get; set; }

    /// <summary>WIN | DRAW | LOSS.</summary>
    public string Result { get; set; } = string.Empty;

    public int GoalsScored { get; set; }
    public int Assists { get; set; }
    public int YellowCards { get; set; }
    public int RedCards { get; set; }
    public int MinutesPlayed { get; set; }
}
