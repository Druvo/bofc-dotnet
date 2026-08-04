using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Rounds.Models;

public class TeamAssignmentRequest
{
    [Required(ErrorMessage = "Team IDs cannot be empty")]
    [MinLength(1, ErrorMessage = "Team IDs cannot be empty")]
    public List<long> TeamIds { get; set; } = [];

    /// <summary>MANUAL, RULE_BASED, PLACEHOLDER.</summary>
    public string? AssignmentType { get; set; }

    public long? GroupId { get; set; }
    public long? RoundId { get; set; }
}
