using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/Player.java.</summary>
public class Player : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string TeamsId { get; set; } = string.Empty;
    public string? MobileNo { get; set; }
    public bool IsActive { get; set; }
    public int? JerseyNumber { get; set; }
    public FootballPosition Position { get; set; }
    public string Password { get; set; } = string.Empty;
    public DateTime? LastPasswordChangeDate { get; set; }
    public string? ProfilePhoto { get; set; }
    public string? PhotoKey { get; set; }

    /// <summary>"light" | "dark" | null (no explicit preference - client falls back to OS/browser preference). Synced across devices since it lives on the player, not localStorage.</summary>
    public string? ThemePreference { get; set; }

    /// <summary>Admin-only skill/seniority rank used purely to balance auto-generated teams
    /// (snake-draft assignment - see WeeklyMatchDayTeamGenerator). Never surfaced to non-admin
    /// player-facing responses. Null = treated as the lowest tier for drafting purposes.</summary>
    public int? Rank { get; set; }

    /// <summary>Admin-set opt-out from goalkeeper auto-assignment (e.g. a player who physically
    /// cannot keep goal). They still count toward fairness history/attendance - this only keeps
    /// them off the auto-pick, never overruled by the balance math (see TeamService's goalkeeper
    /// fairness calculation). Never surfaced to non-admin player-facing responses, same
    /// convention as Rank.</summary>
    public bool ExcludeFromGoalkeeperRotation { get; set; }

    /// <summary>Admin-set opt-IN: this player only ever wants to play goalkeeper. Mutually
    /// exclusive with ExcludeFromGoalkeeperRotation (setting one clears the other - see
    /// PlayerService). Gets first claim on a team's goalkeeper slot(s) in auto-assign, ahead of
    /// the fairness balance math; if more default goalkeepers exist on one team than the
    /// configured MinGoalkeepersPerTeam slots, who gets picked is a random draw among them rather
    /// than by balance (see TeamService.SelectGoalkeepersForTeam). Never overrides a slot a human
    /// already filled - only ever competes for open slots, same as the balance-ranked picks.
    /// Never surfaced to non-admin player-facing responses, same convention as Rank.</summary>
    public bool DefaultGoalkeeper { get; set; }

    /// <summary>Temporarily out of circulation - travelling, injured, on leave - while remaining
    /// a member of the club.
    ///
    /// Distinct from <see cref="IsActive"/>, which means they have left: a paused player keeps
    /// their history, their stats and their place in the player list, and an admin can bring them
    /// back with one toggle. What pausing does is stop the club asking. They are not counted in a
    /// Match Day's expected turnout, they are not listed as someone still to respond, and no
    /// reminder - Match Day or payment - is addressed to them. Left unpaused, an away player sits
    /// in the "pending" column week after week and quietly makes the turnout look worse than it is.</summary>
    public bool IsPaused { get; set; }

    /// <summary>Player's own opt-in/out of system-generated emails (payment/matchday reminders,
    /// teams-announced). Defaults to true - only an explicit opt-out stops delivery. Checked
    /// alongside IsActive everywhere reminder emails go out (see PlayerService's active-player
    /// queries used by the reminder background services).</summary>
    public bool EmailNotificationsEnabled { get; set; } = true;

    public ICollection<Role> Roles { get; set; } = new List<Role>();
}
