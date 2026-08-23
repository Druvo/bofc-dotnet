namespace BofcBackend.Api.Features.Teams.Models;

public class ClearGoalkeepersResponse
{
    public List<ClearedGoalkeeper> Cleared { get; init; } = [];
}

public class ClearedGoalkeeper
{
    public long TeamId { get; init; }
    public string TeamName { get; init; } = string.Empty;
    public long PlayerId { get; init; }
    public string PlayerName { get; init; } = string.Empty;
}
