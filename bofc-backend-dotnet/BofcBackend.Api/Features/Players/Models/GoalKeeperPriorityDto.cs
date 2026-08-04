namespace BofcBackend.Api.Features.Players.Models;

public class GoalKeeperPriorityDto
{
    public int Priority { get; set; }
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;

    /// <summary>Format: dd-MM-yy (e.g., "15-11-25").</summary>
    public List<string> PlayAsGkDates { get; set; } = [];

    public int TotalTournamentParticipations { get; set; }
    public int ActiveTournamentCount { get; set; }

    /// <summary>%: (totalParticipations / activeTournamentCount) * 100.</summary>
    public double ParticipationFrequency { get; set; }

    public int TotalGoalKeeperTournaments { get; set; }
    public DateTime? LastGoalKeeperDate { get; set; }

    /// <summary>Format: dd-MM-yy. Last tournament participation date (excluding current).</summary>
    public string? LastPlayedTournamentDate { get; set; }
}
