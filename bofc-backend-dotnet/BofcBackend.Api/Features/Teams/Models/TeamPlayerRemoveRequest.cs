using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TeamPlayerRemoveRequest.java.</summary>
public class TeamPlayerRemoveRequest
{
    [Required(ErrorMessage = "Team ID is required")]
    public long? TeamId { get; set; }

    [Required(ErrorMessage = "Player ID is required")]
    public long? PlayerId { get; set; }
}
