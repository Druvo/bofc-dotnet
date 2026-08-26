namespace BofcBackend.Api.Features.Settings.Models;

public class SystemSettingsResponse
{
    public bool SmtpEnabled { get; set; }
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; }
    public string? SmtpUsername { get; set; }

    /// <summary>Never the real password - true if one is stored, so the UI can show a "•••• saved" placeholder without ever round-tripping the secret.</summary>
    public bool SmtpPasswordSet { get; set; }

    public string? SmtpFromEmail { get; set; }
    public string? SmtpFromName { get; set; }
    public bool SmtpUseSsl { get; set; }

    public bool NotifyMatchDayReminderEnabled { get; set; }
    public int MatchDayReminderDaysBefore { get; set; }
    /// <summary>Hours between re-sends during the reminder window - only to players who still haven't voted.</summary>
    public int MatchDayReminderRepeatHours { get; set; } = 48;

    public bool NotifyPaymentDueEnabled { get; set; }
    public int PaymentDueReminderDayOfMonth { get; set; }
    /// <summary>Days between re-sends after the trigger day - only to players still unpaid for the month.</summary>
    public int PaymentDueReminderRepeatDays { get; set; } = 10;

    public bool NotifyCustomEmailEnabled { get; set; }

    public bool PushNotificationsEnabled { get; set; }

    public bool AuctionEnabled { get; set; }

    /// <summary>How often (hours) the background job re-checks and concludes overdue MatchDays.</summary>
    public int MatchDayStatusCheckIntervalHours { get; set; } = 1;

    public bool WeeklyMatchDayEnabled { get; set; }
    public string WeeklyMatchDayNamePrefix { get; set; } = "Next Match";
    public string WeeklyMatchDayOfWeek { get; set; } = "Friday";

    /// <summary>"HH:mm" - 24-hour local time.</summary>
    public string WeeklyMatchTime { get; set; } = "19:00";

    public long? WeeklyMatchDayVenueId { get; set; }
    public string? WeeklyMatchDayVenueName { get; set; }
    public string WeeklyMatchDaySportType { get; set; } = "FOOTBALL";

    public int MatchDaysPerWeek { get; set; } = 1;
    public List<WeeklyMatchDaySlotDto> WeeklyMatchDaySlots { get; set; } = new();
    public int WeeklyMatchDayMaxPlayersPerTeam { get; set; } = 6;
    public bool WeeklyMatchDayAutoTeamsEnabled { get; set; }
    public int WeeklyMatchDayAutoTeamsLeadHours { get; set; } = 24;

    /// <summary>Effective code in use right now (Settings override, or the appsettings default if never set) - never null, so the UI always has something to show.</summary>
    public string CashChartCode { get; set; } = string.Empty;
    public string? CashChartName { get; set; }
    public string CollectionIncomeChartCode { get; set; } = string.Empty;
    public string? CollectionIncomeChartName { get; set; }

    /// <summary>True only when an admin has explicitly overridden the appsettings default via this page.</summary>
    public bool CashChartCodeIsOverridden { get; set; }
    public bool CollectionIncomeChartCodeIsOverridden { get; set; }

    /// <summary>The club-wide jersey colors matches are assigned from - a configurable list (any count), not hardcoded to 2.</summary>
    public List<string> JerseyColors { get; set; } = new();
}
