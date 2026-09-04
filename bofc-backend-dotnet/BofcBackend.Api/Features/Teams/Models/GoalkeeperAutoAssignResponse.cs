namespace BofcBackend.Api.Features.Teams.Models;

public class GoalkeeperAutoAssignResponse
{
    public List<TeamGoalkeeperAssignmentResult> Teams { get; init; } = [];

    /// <summary>How many of the past MatchDays that fed into this calculation had zero goalkeeper
    /// recorded at all - the club's own "N of M past matches have no goalkeeper recorded"
    /// transparency note. A non-zero count means the balances below are partly an estimate.</summary>
    public int PastMatchDaysMissingGoalkeeperData { get; init; }
    public int PastMatchDaysConsidered { get; init; }
}

public class TeamGoalkeeperAssignmentResult
{
    public long TeamId { get; init; }
    public string TeamName { get; init; } = string.Empty;

    /// <summary>Every player newly assigned to goalkeeper for this team this run - empty if none
    /// (the team was already at or past the configured MinGoalkeepersPerTeam, or had no eligible
    /// players left to fill the remaining gap; see SkippedReason).</summary>
    public List<AssignedGoalkeeperPlayer> Assigned { get; init; } = [];
    public string? SkippedReason { get; init; }
}

public class AssignedGoalkeeperPlayer
{
    public long PlayerId { get; init; }
    public string PlayerName { get; init; } = string.Empty;

    /// <summary>True if this pick was made because the player only ever wants to play goalkeeper
    /// (Player.DefaultGoalkeeper), rather than by the fairness balance ranking.</summary>
    public bool IsDefaultGoalkeeper { get; init; }
}
