using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/MatchDay.java.</summary>
public class MatchDay : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Season { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? RoadmapImageUrl { get; set; }
    public DateTime MatchDayDate { get; set; }

    /// <summary>How long the MatchDay itself runs, from MatchDayDate — drives the
    /// client-derived "effective status" (UPCOMING before start, ONGOING during the
    /// window, CONCLUDED after) shown across Dashboard/MatchDay Viewer/MatchDay
    /// pages. Null = unknown duration, callers fall back to a default window.</summary>
    public int? DurationMinutes { get; set; }

    public long VenueId { get; set; }
    public Venue Venue { get; set; } = null!;

    public MatchDayStatus MatchDayStatus { get; set; }
    public bool IsActive { get; set; }
    public bool DefaultMatchDay { get; set; }
    public SportType SportType { get; set; }
    public MatchDayType MatchDayType { get; set; }
    public int? GroupCount { get; set; }
    public bool AuctionMode { get; set; }

    /// <summary>Set once the "MatchDay starting soon" reminder email/notification has gone out — prevents re-sending on every scheduler tick.</summary>
    public DateTime? ReminderSentAt { get; set; }

    /// <summary>True for MatchDays auto-created weekly by MatchDaySchedulerBackgroundService ("Match Day") rather than manually created by an admin — drives simplified nav/tabs and scopes the season-cumulative stats leaderboard.</summary>
    public bool IsWeeklyMatchDay { get; set; }

    // Java's MatchDay entity is bidirectional ONLY with Team (OneToMany "teams" below).
    // MatchDayRound/MatchDayParticipant/LogicNode/MatchDayPrize/
    // PlayerGoalkeepingHistory/Match all reference MatchDay via a unidirectional
    // @ManyToOne — MatchDay does not declare a back-collection for them in Java,
    // so none is added here either (mapped via HasOne().WithMany() with no inverse).
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}
