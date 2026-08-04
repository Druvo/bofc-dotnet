using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.ClubRules.Models;

public class ClubRuleRequest
{
    [Required(ErrorMessage = "rule description is required.")]
    public string Description { get; set; } = string.Empty;
}
