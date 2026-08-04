using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Rounds.Models;

public class RoundCompletionRequest
{
    [Required(ErrorMessage = "Round ID is required")]
    public long? RoundId { get; set; }

    /// <summary>Whether to recalculate group standings (default: true).</summary>
    public bool? RecalculateStandings { get; set; }

    /// <summary>Manual team selection for advancement — teams to advance to the next round. If empty, the round completes without advancement.</summary>
    public List<long>? SelectedTeamIds { get; set; }
}
