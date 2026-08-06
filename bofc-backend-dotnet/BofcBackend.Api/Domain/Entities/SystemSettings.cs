using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// Single-row admin-editable global settings (SMTP + which automated email notifications
/// are enabled). Always id=1 — SettingsService creates the row on first read if missing,
/// so the app works before an admin has ever opened the Settings page.
/// </summary>
public class SystemSettings : AuditableEntity
{
    public long Id { get; set; }

    public bool SmtpEnabled { get; set; }
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }

    /// <summary>Encrypted at rest via IDataProtector — never returned to the client in plaintext.</summary>
    public string? SmtpPasswordEncrypted { get; set; }

    public string? SmtpFromEmail { get; set; }
    public string? SmtpFromName { get; set; }
    public bool SmtpUseSsl { get; set; } = true;

    public bool NotifyTournamentReminderEnabled { get; set; }
    public int TournamentReminderDaysBefore { get; set; } = 3;

    public bool NotifyPaymentDueEnabled { get; set; }
    public int PaymentDueReminderDayOfMonth { get; set; } = 25;

    /// <summary>Master switch for the "also send email" option on custom/manual notifications.</summary>
    public bool NotifyCustomEmailEnabled { get; set; }

    /// <summary>Master switch for Web Push delivery — when off, no push is sent regardless of individual player subscriptions.</summary>
    public bool PushNotificationsEnabled { get; set; } = true;

    /// <summary>Master switch for the player-auction feature — when off, the Auction nav entry and "Auction Mode" toggle are hidden.</summary>
    public bool AuctionEnabled { get; set; } = true;

    /// <summary>"yyyy-MM" of the last month the payment-due reminder actually ran — guards against re-sending twice in one month.</summary>
    public string? LastPaymentReminderSentMonth { get; set; }

    // --- Match Day: drives MatchDaySchedulerBackgroundService, which auto-creates a Tournament
    // (IsWeeklyMatchDay=true) every week from these settings — day/time/venue/sport are the
    // tournament's own date/venue/sport-type; duration + time-gap drive the sequential match
    // time-slotting when generating that day's round-robin fixtures.
    public bool WeeklyMatchEnabled { get; set; }

    /// <summary>Prefix used when naming each auto-created weekly tournament: "{prefix} — {date}", e.g. "Next Match — Aug 7, 2026".</summary>
    public string WeeklyMatchNamePrefix { get; set; } = "Next Match";

    public DayOfWeek WeeklyMatchDayOfWeek { get; set; } = DayOfWeek.Friday;
    public TimeSpan WeeklyMatchTime { get; set; } = new(19, 0, 0);
    public long? WeeklyMatchVenueId { get; set; }
    public Venue? WeeklyMatchVenue { get; set; }
    public SportType WeeklyMatchSportType { get; set; } = SportType.FOOTBALL;
    public int WeeklyMatchDurationMinutes { get; set; } = 90;

    /// <summary>Gap (minutes) between each auto-generated match's start time on a Match Day — e.g. a 13-minute match on a 15-minute gap slots matches at :00, :15, :30...</summary>
    public int WeeklyMatchTimeGapMinutes { get; set; } = 15;

    // --- Accounting: which chart-of-account postings auto-generated vouchers hit. Null = fall
    // back to the Accounting:CashChartCode/CollectionIncomeChartCode appsettings defaults (see
    // AccountingOptions) — lets a fresh deployment work before an admin ever visits Settings.
    public string? CashChartCode { get; set; }
    public string? CollectionIncomeChartCode { get; set; }

    // --- Jersey colors: the club owns only 2 physical jerseys, so match-day jersey
    // assignment (Match.HomeJerseyColor/AwayJerseyColor) is constrained to these 2
    // club-wide colors rather than a free palette.
    public string JerseyColorA { get; set; } = "red";
    public string JerseyColorB { get; set; } = "yellow";
}
