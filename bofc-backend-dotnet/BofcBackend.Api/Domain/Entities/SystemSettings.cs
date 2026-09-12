using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// Single-row admin-editable global settings (SMTP + which automated email notifications
/// are enabled). Always id=1 - SettingsService creates the row on first read if missing,
/// so the app works before an admin has ever opened the Settings page.
/// </summary>
public class SystemSettings : AuditableEntity
{
    public long Id { get; set; }

    public bool SmtpEnabled { get; set; }
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }

    /// <summary>Encrypted at rest via IDataProtector - never returned to the client in plaintext.</summary>
    public string? SmtpPasswordEncrypted { get; set; }

    public string? SmtpFromEmail { get; set; }
    public string? SmtpFromName { get; set; }
    public bool SmtpUseSsl { get; set; } = true;

    public bool NotifyMatchDayReminderEnabled { get; set; }
    public int MatchDayReminderDaysBefore { get; set; } = 4;

    /// <summary>Hours between re-sends during the reminder window (MatchDayReminderDaysBefore
    /// through kickoff) - each re-send only goes to players who still haven't voted, so it
    /// naturally tapers off as RSVPs come in and stops entirely once the MatchDay starts.</summary>
    public int MatchDayReminderRepeatHours { get; set; } = 48;

    public bool NotifyPaymentDueEnabled { get; set; }
    public int PaymentDueReminderDayOfMonth { get; set; } = 5;

    /// <summary>Days between re-sends after PaymentDueReminderDayOfMonth - each re-send only
    /// goes to players still showing no payment for the current month, so it naturally stops
    /// nagging a player once they pay.</summary>
    public int PaymentDueReminderRepeatDays { get; set; } = 10;

    /// <summary>Master switch for the "also send email" option on custom/manual notifications.</summary>
    public bool NotifyCustomEmailEnabled { get; set; }

    /// <summary>Master switch for Web Push delivery - when off, no push is sent regardless of individual player subscriptions.</summary>
    public bool PushNotificationsEnabled { get; set; } = true;

    /// <summary>When the payment-due reminder last actually sent (to whoever was still unpaid at
    /// the time) - paired with PaymentDueReminderDayOfMonth/PaymentDueReminderRepeatDays to decide
    /// when the next re-send is due. Null before the first send ever.</summary>
    public DateTime? LastPaymentReminderSentAt { get; set; }

    /// <summary>How often MatchDayStatusSchedulerBackgroundService re-checks and concludes overdue MatchDays. Re-read fresh on every cycle, so a change here takes effect after the current cycle finishes - no restart needed.</summary>
    public int MatchDayStatusCheckIntervalHours { get; set; } = 1;

    /// <summary>Master switch for closing RSVP voting some hours before kickoff. When off, players
    /// can change their vote right up until MatchDayDate, as before.</summary>
    public bool VotingLockEnabled { get; set; }

    /// <summary>How many hours before kickoff voting closes, once VotingLockEnabled is on - checked
    /// against DateTime.Now by both vote paths (the in-app RSVP and the anonymous email-link vote).</summary>
    public int VotingLockHoursBeforeMatch { get; set; } = 5;

    /// <summary>True once "now" is inside the lock window for the given MatchDay - shared by both
    /// vote paths (MatchDayParticipantService, MatchDayVoteController) so the cutoff math lives in
    /// exactly one place.</summary>
    public bool IsVotingLockedFor(DateTime matchDayDate, DateTime now) =>
        VotingLockEnabled && now >= matchDayDate.AddHours(-VotingLockHoursBeforeMatch);

    /// <summary>The complete RSVP lock: the time window above, plus the freeze that applies once
    /// teams have been drafted. Both are governed by VotingLockEnabled, so turning the toggle off
    /// releases an existing team freeze as well - that is deliberate and admin-facing. The freeze
    /// exists because teams are built FROM the confirmed RSVPs at that moment, so a later vote
    /// change leaves the roster out of step with the votes; with the toggle off, reconciling that
    /// is the organiser's job in Team Building.
    ///
    /// Every caller must use this rather than testing <paramref name="teamsBuilt"/> on its own:
    /// the freeze used to be applied inline at each vote path, which is exactly how it came to
    /// ignore the toggle.</summary>
    public bool IsVotingLockedFor(DateTime matchDayDate, DateTime now, bool teamsBuilt) =>
        VotingLockEnabled && (teamsBuilt || now >= matchDayDate.AddHours(-VotingLockHoursBeforeMatch));

    // --- Match Day: drives MatchDaySchedulerBackgroundService, which auto-creates a MatchDay
    // (IsWeeklyMatchDay=true) for every configured WeeklyMatchDaySlot each week - venue/sport are
    // shared across all slots; duration + time-gap drive the sequential match time-slotting
    // when generating that day's round-robin fixtures.
    public bool WeeklyMatchDayEnabled { get; set; }

    /// <summary>Prefix used when naming each auto-created weekly MatchDay: "{prefix} - {date}", e.g. "Next Match - Aug 7, 2026".</summary>
    public string WeeklyMatchDayNamePrefix { get; set; } = "Next Match";

    /// <summary>Legacy single day/time - superseded by WeeklyMatchDaySlots (kept mapped so old rows
    /// aren't silently dropped; a migration seeds one WeeklyMatchDaySlot from these on upgrade).
    /// Not written to by the current UI or read by the scheduler.</summary>
    public DayOfWeek WeeklyMatchDayOfWeek { get; set; } = DayOfWeek.Friday;
    public TimeSpan WeeklyMatchTime { get; set; } = new(19, 0, 0);

    public long? WeeklyMatchDayVenueId { get; set; }
    public Venue? WeeklyMatchDayVenue { get; set; }
    public SportType WeeklyMatchDaySportType { get; set; } = SportType.FOOTBALL;

    /// <summary>How many MatchDays per week to auto-create - one MatchDay per WeeklyMatchDaySlots row, up to this count.</summary>
    public int MatchDaysPerWeek { get; set; } = 1;

    /// <summary>Which day(s)/time(s) of the week to auto-create a MatchDay for - one row per MatchDay, count driven by MatchDaysPerWeek.</summary>
    public ICollection<WeeklyMatchDaySlot> WeeklyMatchDaySlots { get; set; } = new List<WeeklyMatchDaySlot>();

    /// <summary>Max squad size (including goalkeeper) for each auto-drafted team - the number of
    /// teams itself is derived at generation time as ceil(confirmedParticipants / this), with a
    /// floor of 2, so turnout swings produce more/fewer teams instead of lopsided team sizes.
    /// Purely a default - an admin can still add/remove players by hand afterward on any given
    /// MatchDay's teams.</summary>
    public int WeeklyMatchDayMaxPlayersPerTeam { get; set; } = 6;

    /// <summary>Master switch for auto team/fixture generation. When off, auto-created MatchDays still get created, just without teams - same as a manually-created one.</summary>
    public bool WeeklyMatchDayAutoTeamsEnabled { get; set; }

    /// <summary>How many hours before kickoff the scheduler auto-drafts teams from confirmed
    /// participants (RSVPs need time to come in first - can't draft before anyone's confirmed).</summary>
    public int WeeklyMatchDayAutoTeamsLeadHours { get; set; } = 24;

    /// <summary>How many goalkeepers "Auto-Assign Goalkeepers" fills per team (a starter plus
    /// backup/rotation cover, not just one) - see TeamService.AutoAssignGoalkeepersAsync. Only
    /// fills the gap up to this count; never demotes an existing pick.</summary>
    public int MinGoalkeepersPerTeam { get; set; } = 2;

    // --- Accounting: which chart-of-account postings auto-generated vouchers hit. Null = fall
    // back to the Accounting:CashChartCode/CollectionIncomeChartCode appsettings defaults (see
    // AccountingOptions) - lets a fresh deployment work before an admin ever visits Settings.
    public string? CashChartCode { get; set; }
    public string? CollectionIncomeChartCode { get; set; }

    // --- Jersey colors: a club-configurable list (any count, not hardcoded to 2) of physical
    // jerseys - match-day jersey assignment (Match.HomeJerseyColor/AwayJerseyColor) is
    // constrained to whichever colors are configured here rather than a free palette.
    public ICollection<JerseyColor> JerseyColors { get; set; } = new List<JerseyColor>();
}
