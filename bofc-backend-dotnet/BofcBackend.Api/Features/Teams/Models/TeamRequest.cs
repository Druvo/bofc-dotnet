using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TeamRequest.java.</summary>
public class TeamRequest
{
    public long? Id { get; set; }

    [Required(ErrorMessage = "Team name is required")]
    public string? TeamName { get; set; }

    [Required(ErrorMessage = "MatchDay ID is required")]
    public long? MatchDayId { get; set; }

    public string? LogoKey { get; set; }
}
