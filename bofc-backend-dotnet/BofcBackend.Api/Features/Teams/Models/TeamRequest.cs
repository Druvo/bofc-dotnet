using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Port of model/TeamRequest.java.</summary>
public class TeamRequest
{
    public long? Id { get; set; }

    /// <summary>Required when renaming an existing team (Id set). Optional when creating a new
    /// one (Id null) - left blank/omitted, the server assigns the next "Team {letter}" itself
    /// (see TeamService.GenerateDefaultTeamNameAsync), rather than the client computing it from
    /// a team count that can be stale (e.g. two "+ Add Team" clicks before the list re-fetches
    /// from the first one - both would otherwise compute the same next letter).</summary>
    public string? TeamName { get; set; }

    [Required(ErrorMessage = "MatchDay ID is required")]
    public long? MatchDayId { get; set; }

    public string? LogoKey { get; set; }
}
