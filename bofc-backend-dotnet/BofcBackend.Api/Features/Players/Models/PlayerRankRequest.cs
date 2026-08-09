using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Players.Models;

public class PlayerRankRequest
{
    /// <summary>Null clears the rank (treated as the lowest tier for team-draft purposes). A
    /// tier, not a unique position — multiple players can share the same rank (1-10).</summary>
    [Range(1, 10)]
    public int? Rank { get; set; }
}
