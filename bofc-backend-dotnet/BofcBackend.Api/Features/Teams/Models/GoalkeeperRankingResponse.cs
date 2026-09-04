namespace BofcBackend.Api.Features.Teams.Models;

public class GoalkeeperRankingResponse
{
    public List<TeamGoalkeeperRanking> Teams { get; init; } = [];
    public int PastMatchDaysConsidered { get; init; }
    public int PastMatchDaysMissingGoalkeeperData { get; init; }
}

public class TeamGoalkeeperRanking
{
    public long TeamId { get; init; }
    public string TeamName { get; init; } = string.Empty;
    public List<GoalkeeperRankingPlayer> Players { get; init; } = [];
}

public class GoalkeeperRankingPlayer
{
    public int Rank { get; init; }
    public long PlayerId { get; init; }
    public string PlayerName { get; init; } = string.Empty;

    /// <summary>Past MatchDays this player attended - the denominator side of their fairness history.</summary>
    public int Played { get; init; }

    /// <summary>Past MatchDays this player actually kept goal in.</summary>
    public int InGoal { get; init; }

    /// <summary>Owed slices minus turns served - the higher this is, the more this player is due.</summary>
    public double Balance { get; init; }

    /// <summary>Admin-opted-in to only ever play goalkeeper (Player.DefaultGoalkeeper) - gets first
    /// claim on this team's open slot(s) ahead of the balance ranking below.</summary>
    public bool IsDefaultGoalkeeper { get; init; }

    /// <summary>One of: NEXT_UP (top eligible pick for this team), ELIGIBLE, RESTING (kept goal in
    /// either of the last two MatchDays), NOT_IN_ROTATION (admin-excluded), CURRENT_GOALKEEPER
    /// (already wearing the gloves for this team this MatchDay).</summary>
    public string Status { get; init; } = string.Empty;
}
