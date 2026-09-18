namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Outcome of one "assign captains" run, per team, so the organiser can see who was
/// chosen and why a team was left alone - mirroring GoalkeeperAutoAssignResponse.</summary>
public class CaptainAutoAssignResponse
{
    public List<TeamCaptainAssignmentResult> Teams { get; set; } = [];

    /// <summary>How many players were eligible to captain this run. Shown because the pool is
    /// derived from rank across the whole club, so a surprising number here usually means ranks
    /// have drifted rather than that anything went wrong with this match day.</summary>
    public int CaptainPoolSize { get; set; }
}

public class TeamCaptainAssignmentResult
{
    public long TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;

    public long? PlayerId { get; set; }
    public string? PlayerName { get; set; }

    /// <summary>False when the team held nobody from the senior pool and the best-ranked
    /// confirmed player was used instead - rare, and worth surfacing rather than hiding.</summary>
    public bool FromCaptainPool { get; set; }

    /// <summary>Set when no captain was assigned: the team already had one (never overridden), or
    /// it has no confirmed participants to choose from.</summary>
    public string? SkippedReason { get; set; }
}
