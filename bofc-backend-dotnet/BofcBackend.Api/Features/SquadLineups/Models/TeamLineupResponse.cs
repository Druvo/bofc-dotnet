namespace BofcBackend.Api.Features.SquadLineups.Models;

public class TeamLineupResponse
{
    public long TeamId { get; set; }

    /// <summary>Null when no lineup has been saved for this team yet - the client applies its own default.</summary>
    public int? SquadSize { get; set; }
    public string? Formation { get; set; }
    public List<LineupPlayerResponse> Starters { get; set; } = [];
    public List<LineupPlayerResponse> Bench { get; set; } = [];
}

public class LineupPlayerResponse
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string PlayingPosition { get; set; } = string.Empty;
    public string Availability { get; set; } = string.Empty;
    public bool IsCaptain { get; set; }
    public string? PhotoKey { get; set; }
    public string? PhotoUrl { get; set; }
}
