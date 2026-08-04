using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TeamRequest.java.</summary>
public class TeamRequest
{
    public long? Id { get; set; }

    [Required(ErrorMessage = "Team name is required")]
    public string? TeamName { get; set; }

    [Required(ErrorMessage = "Tournament ID is required")]
    public long? TournamentId { get; set; }

    public string? LogoKey { get; set; }
}
