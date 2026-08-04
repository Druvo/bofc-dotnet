using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Rounds.Models;

/// <summary>
/// Manual penalty-shootout tiebreak for a group. The admin supplies team IDs in their final
/// finishing order (after the shootout) for the set of teams level on every other criterion.
/// The first ID gets TiebreakRank 1 (ranks highest), and so on.
/// </summary>
public class GroupTiebreakRequest
{
    [Required(ErrorMessage = "orderedTeamIds must contain at least one team")]
    [MinLength(1, ErrorMessage = "orderedTeamIds must contain at least one team")]
    public List<long> OrderedTeamIds { get; set; } = [];
}
