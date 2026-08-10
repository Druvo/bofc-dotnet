namespace BofcBackend.Api.Features.Statistics.Models;

/// <summary>The current manual correction stored for a player - all zero/null if an admin has
/// never set one. Admin-only (see PlayerStatisticsController).</summary>
public class PlayerStatAdjustmentResponse
{
    public long PlayerId { get; set; }

    /// <summary>Null when this is the player's lifetime/overall adjustment; set when scoped to one Match.</summary>
    public long? MatchId { get; set; }
    public int GoalsAdjustment { get; set; }
    public int AssistsAdjustment { get; set; }
    public int YellowCardsAdjustment { get; set; }
    public int RedCardsAdjustment { get; set; }
    public int MatchesPlayedAdjustment { get; set; }
    public string? Note { get; set; }
}
