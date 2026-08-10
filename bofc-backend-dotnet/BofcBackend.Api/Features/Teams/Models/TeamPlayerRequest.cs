using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TeamPlayerRequest.java.</summary>
public class TeamPlayerRequest
{
    public long? Id { get; set; }

    [Required(ErrorMessage = "Team ID is required")]
    public long? TeamId { get; set; }

    [Required(ErrorMessage = "Player ID is required")]
    public long? PlayerId { get; set; }

    /// <summary>
    /// Matched against FootballPosition's description text (case-insensitive), not the enum
    /// constant name - mirrors Java's FootballPosition.getPositionOrDefault exactly, including
    /// its quirk that multi-word constants (e.g. RIGHT_BACK) only match their spaced description
    /// ("Right Back"), not the underscored constant name.
    /// </summary>
    [Required(ErrorMessage = "Playing position is required")]
    public string? PlayingPosition { get; set; }

    public bool? IsCaptain { get; set; }

    public string? TeamPlayerRole { get; set; }

    public int? JerseyNumber { get; set; }
}
