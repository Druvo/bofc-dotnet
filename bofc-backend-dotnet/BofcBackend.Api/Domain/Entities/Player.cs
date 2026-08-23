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

    public ICollection<Role> Roles { get; set; } = new List<Role>();
}
