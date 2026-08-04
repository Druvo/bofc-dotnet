using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TeamPlayerResponse.java.</summary>
public class TeamPlayerResponse
{
    public long Id { get; set; }
    public long TeamId { get; set; }
    public long PlayerId { get; set; }
    public string? TeamName { get; set; }
    public string? PlayerName { get; set; }
    public FootballPosition PlayingPosition { get; set; }
    public string TeamPlayerRole { get; set; } = string.Empty;
    public bool? IsCaptain { get; set; }
    public int? JerseyNumber { get; set; }
    public string? PhotoKey { get; set; }
    public string? PhotoUrl { get; set; }
}
