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
    public bool Assigned { get; init; }
    public long? PlayerId { get; init; }
    public string? PlayerName { get; init; }
    public string? SkippedReason { get; init; }
}
