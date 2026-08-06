using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Statistics.Models;

public class PlayerStatisticsFilterRequest
{
    /// <summary>Filter by MatchDay participation (null = all players; provided = only players in teams for that MatchDay).</summary>
    public long? MatchDayId { get; set; }

    /// <summary>Season-cumulative leaderboard across every auto-created Match Day (IsWeeklyMatchDay=true), ignoring MatchDayId. Mutually exclusive with MatchDayId in practice — if both are set, MatchDayId wins.</summary>
    public bool WeeklyMatchDaysOnly { get; set; }

    public FootballPosition? Position { get; set; }

    /// <summary>Sort field: goals, assists, goalsAssists, matches.</summary>
    public string SortBy { get; set; } = "goalsAssists";

    /// <summary>ASC or DESC.</summary>
    public string SortOrder { get; set; } = "DESC";

    public int Limit { get; set; } = 100;
    public int Offset { get; set; }
}
