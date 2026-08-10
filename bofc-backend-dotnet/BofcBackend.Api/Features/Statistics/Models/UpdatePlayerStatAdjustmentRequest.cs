using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Statistics.Models;

/// <summary>Replaces the player's whole manual-adjustment row - full replace, not a delta on top
/// of whatever was there before, so the admin always sees and edits the actual stored numbers.</summary>
public class UpdatePlayerStatAdjustmentRequest
{
    [Range(-500, 500)]
    public int GoalsAdjustment { get; set; }

    [Range(-500, 500)]
    public int AssistsAdjustment { get; set; }

    [Range(-500, 500)]
    public int YellowCardsAdjustment { get; set; }

    [Range(-500, 500)]
    public int RedCardsAdjustment { get; set; }

    [Range(-500, 500)]
    public int MatchesPlayedAdjustment { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}
