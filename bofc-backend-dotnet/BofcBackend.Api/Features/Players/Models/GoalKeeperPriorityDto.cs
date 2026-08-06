namespace BofcBackend.Api.Features.Players.Models;

public class GoalKeeperPriorityDto
{
    public int Priority { get; set; }
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;

    /// <summary>Format: dd-MM-yy (e.g., "15-11-25").</summary>
    public List<string> PlayAsGkDates { get; set; } = [];

    public int TotalMatchDayParticipations { get; set; }
    public int ActiveMatchDayCount { get; set; }

    /// <summary>%: (totalParticipations / activeMatchDayCount) * 100.</summary>
    public double ParticipationFrequency { get; set; }

    public int TotalGoalKeeperMatchDays { get; set; }
    public DateTime? LastGoalKeeperDate { get; set; }

    /// <summary>Format: dd-MM-yy. Last MatchDay participation date (excluding current).</summary>
    public string? LastPlayedMatchDayDate { get; set; }
}
