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

    /// <summary>How long the MatchDay itself runs, from MatchDayDate - drives the
    /// client-derived "effective status" (UPCOMING before start, ONGOING during the
    /// window, CONCLUDED after) shown across Dashboard/MatchDay Viewer/MatchDay
    /// pages. Null = unknown duration, callers fall back to a default window.</summary>
    public int? DurationMinutes { get; set; }

    /// <summary>Gap (minutes) between each auto-generated match's start time, denormalized from
    /// the originating WeeklyMatchDaySlot at creation time (mirrors DurationMinutes) - needed
    /// because team/fixture generation runs later against just a MatchDayId, with no live
    /// reference back to the slot it came from. Null for manually-created MatchDays.</summary>
    public int? TimeGapMinutes { get; set; }

    /// <summary>Length (minutes) of each individual auto-generated match, denormalized from the
    /// originating WeeklyMatchDaySlot at creation time (mirrors DurationMinutes/TimeGapMinutes).
    /// Not the same as DurationMinutes above, which is the whole MatchDay's length. Null for
    /// manually-created MatchDays.</summary>
    public int? MatchDurationMinutes { get; set; }

    public long VenueId { get; set; }
    public Venue Venue { get; set; } = null!;

    public MatchDayStatus MatchDayStatus { get; set; }
    public bool IsActive { get; set; }
    public bool DefaultMatchDay { get; set; }
    public SportType SportType { get; set; }
    public MatchDayType MatchDayType { get; set; }
    public int? GroupCount { get; set; }

    /// <summary>When the "MatchDay starting soon" reminder last actually went out (to whoever
    /// hadn't voted yet at the time) - paired with SystemSettings.MatchDayReminderRepeatHours to
    /// decide when the next re-send is due. Null before the first send ever.</summary>
    public DateTime? ReminderSentAt { get; set; }

    /// <summary>True for MatchDays auto-created weekly by MatchDaySchedulerBackgroundService ("Match Day") rather than manually created by an admin - drives simplified nav/tabs and scopes the season-cumulative stats leaderboard.</summary>
    public bool IsWeeklyMatchDay { get; set; }

    /// <summary>Which configured weekly slot this auto-created MatchDay fulfills, fixed at
    /// creation time and never touched again - this (not MatchDayDate) is what the scheduler
    /// checks to decide a slot is already covered, so an admin moving the date around doesn't
    /// cause a duplicate to be generated. Null for manually-created MatchDays.</summary>
    public DayOfWeek? AutoGenSlotDayOfWeek { get; set; }

    /// <summary>Monday of the week this auto-created MatchDay was generated for - paired with
    /// AutoGenSlotDayOfWeek to identify "this week's Friday slot" independent of the current
    /// MatchDayDate. Null for manually-created MatchDays.</summary>
    public DateTime? AutoGenWeekStart { get; set; }

    /// <summary>Set the first time an admin edits an auto-generated MatchDay's date/time -
    /// purely informational (surfaced in the UI as "manually adjusted"); the scheduler's
    /// skip-logic relies on AutoGenSlotDayOfWeek/AutoGenWeekStart, not this flag.</summary>
    public bool IsManuallyModified { get; set; }

    /// <summary>Set once auto-generated teams+fixtures have been created for this MatchDay,
    /// so the lead-time check in the scheduler (and the manual "Generate now" trigger) don't
    /// re-run and duplicate teams on every tick.</summary>
    public bool AutoTeamsGenerated { get; set; }

    // Java's MatchDay entity is bidirectional ONLY with Team (OneToMany "teams" below).
    // MatchDayRound/MatchDayParticipant/LogicNode/MatchDayPrize/
    // PlayerGoalkeepingHistory/Match all reference MatchDay via a unidirectional
    // @ManyToOne - MatchDay does not declare a back-collection for them in Java,
    // so none is added here either (mapped via HasOne().WithMany() with no inverse).
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}
