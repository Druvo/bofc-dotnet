using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.SquadLineups.Models;

public class UpdateTeamLineupRequest
{
    [Required(ErrorMessage = "Squad size is mandatory")]
    public int? SquadSize { get; set; }

    [Required(ErrorMessage = "Formation is mandatory")]
    public string? Formation { get; set; }

    public List<LineupPlayerRequest> Starters { get; set; } = [];
    public List<LineupPlayerRequest> Bench { get; set; } = [];
}

public class LineupPlayerRequest
{
    [Required(ErrorMessage = "Player ID is mandatory")]
    public long? PlayerId { get; set; }

    /// <summary>"FIT" | "DOUBTFUL" | "INJURED" — defaults to FIT if omitted.</summary>
    public string? Availability { get; set; }
}
