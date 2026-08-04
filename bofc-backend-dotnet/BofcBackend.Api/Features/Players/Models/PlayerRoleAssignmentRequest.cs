using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Players.Models;

/// <summary>Port of model/PlayerRoleAssignmentRequest.java.</summary>
public class PlayerRoleAssignmentRequest
{
    [Required(ErrorMessage = "Player role mappings cannot be empty")]
    [MinLength(1, ErrorMessage = "Player role mappings cannot be empty")]
    public Dictionary<long, HashSet<long>> PlayerRoleMappings { get; set; } = [];
}
