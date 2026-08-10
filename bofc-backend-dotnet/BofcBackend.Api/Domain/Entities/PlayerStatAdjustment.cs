namespace BofcBackend.Api.Domain.Entities;

/// <summary>Admin-entered manual correction added on top of a player's match-derived statistics.
/// Goals/assists/cards/matches-played are always computed live from MatchEvents tied to a real
/// Match (see PlayerStatisticsService) - there is no other field anywhere that can be typed into
/// directly, so this exists specifically for things like backfilling history from before this
/// app tracked matches. One row per player (upsert-on-edit), not an accumulating log - CreatedBy
/// and LastModifiedBy from AuditableEntity are the only trail of who last touched it.</summary>
public class PlayerStatAdjustment : AuditableEntity
{
    public long Id { get; set; }
    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    /// <summary>Null = lifetime/overall adjustment. Set = scoped to one specific Match instead.</summary>
    public long? MatchId { get; set; }
    public Match? Match { get; set; }
    public int GoalsAdjustment { get; set; }
    public int AssistsAdjustment { get; set; }
    public int YellowCardsAdjustment { get; set; }
    public int RedCardsAdjustment { get; set; }
    public int MatchesPlayedAdjustment { get; set; }

    /// <summary>Free-text admin context (e.g. "carried over from the old spreadsheet") - never shown to players.</summary>
    public string? Note { get; set; }
}
