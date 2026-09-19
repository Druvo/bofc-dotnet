namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>A guest player sitting on a team, as the team sheet sees them: a name and the
/// id needed to move or remove them. There is nothing else to send - see
/// <see cref="Domain.Entities.MatchDayGuest"/>. Kept in its own list rather than folded into
/// Players so that no consumer of Players (squad lineup, goalkeeper assignment, statistics)
/// has to learn the difference.</summary>
public class TeamGuestResponse
{
    public long GuestId { get; set; }
    public long TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
}
