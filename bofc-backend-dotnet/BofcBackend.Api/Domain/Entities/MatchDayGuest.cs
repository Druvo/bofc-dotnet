namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// A one-off player who turns up for a single MatchDay without being a club member - a
/// friend brought along to make up the numbers. A guest is a name on a team sheet and
/// nothing else: deliberately NOT a <see cref="Player"/>, so no profile, no login, no
/// email, and no reach into attendance, statistics, leaderboards, goalkeeper rotation or
/// payments. Every one of those reads from Player/TeamPlayer, which a guest never touches.
///
/// Scoped to one MatchDay - the same person turning up two weeks running is two guest rows,
/// because there is no identity here to carry forward, only a name someone typed.
///
/// <see cref="TeamId"/> null means "sitting in the Unassigned Pool on the Team Building
/// page"; dragging the guest onto a team sets it. The FK to Team is deliberately NOT
/// cascade-delete: deleting a team returns its guests to the pool (see
/// TeamService.DeleteTeamAsync) rather than destroying names the organiser typed in.
/// Deleting the MatchDay itself does cascade - the guest has no meaning outside it.
/// </summary>
public class MatchDayGuest : AuditableEntity
{
    public long Id { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    /// <summary>Null = unassigned (Unassigned Pool).</summary>
    public long? TeamId { get; set; }
    public Team? Team { get; set; }
}
