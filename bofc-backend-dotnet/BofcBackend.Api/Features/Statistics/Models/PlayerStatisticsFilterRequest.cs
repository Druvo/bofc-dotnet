using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Statistics.Models;

public class PlayerStatisticsFilterRequest
{
    /// <summary>Filter by tournament participation (null = all players; provided = only players in teams for that tournament).</summary>
    public long? TournamentId { get; set; }

    /// <summary>Season-cumulative leaderboard across every auto-created Match Day (IsWeeklyMatchDay=true), ignoring TournamentId. Mutually exclusive with TournamentId in practice — if both are set, TournamentId wins.</summary>
    public bool WeeklyMatchDaysOnly { get; set; }

    public FootballPosition? Position { get; set; }

    /// <summary>Sort field: goals, assists, goalsAssists, matches.</summary>
    public string SortBy { get; set; } = "goalsAssists";

    /// <summary>ASC or DESC.</summary>
    public string SortOrder { get; set; } = "DESC";

    public int Limit { get; set; } = 100;
    public int Offset { get; set; }
}
