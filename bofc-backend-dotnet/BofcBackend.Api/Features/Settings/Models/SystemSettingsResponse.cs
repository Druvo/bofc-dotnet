namespace BofcBackend.Api.Features.Settings.Models;

public class SystemSettingsResponse
{
    public bool SmtpEnabled { get; set; }
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; }
    public string? SmtpUsername { get; set; }

    /// <summary>Never the real password — true if one is stored, so the UI can show a "•••• saved" placeholder without ever round-tripping the secret.</summary>
    public bool SmtpPasswordSet { get; set; }

    public string? SmtpFromEmail { get; set; }
    public string? SmtpFromName { get; set; }
    public bool SmtpUseSsl { get; set; }

    public bool NotifyTournamentReminderEnabled { get; set; }
    public int TournamentReminderDaysBefore { get; set; }

    public bool NotifyPaymentDueEnabled { get; set; }
    public int PaymentDueReminderDayOfMonth { get; set; }

    public bool NotifyCustomEmailEnabled { get; set; }

    public bool PushNotificationsEnabled { get; set; }

    public bool AuctionEnabled { get; set; }

    public bool WeeklyMatchEnabled { get; set; }
    public string WeeklyMatchNamePrefix { get; set; } = "Next Match";
    public string WeeklyMatchDayOfWeek { get; set; } = "Friday";

    /// <summary>"HH:mm" — 24-hour local time.</summary>
    public string WeeklyMatchTime { get; set; } = "19:00";

    public long? WeeklyMatchVenueId { get; set; }
    public string? WeeklyMatchVenueName { get; set; }
    public string WeeklyMatchSportType { get; set; } = "FOOTBALL";
    public int WeeklyMatchDurationMinutes { get; set; }
    public int WeeklyMatchTimeGapMinutes { get; set; }

    /// <summary>Effective code in use right now (Settings override, or the appsettings default if never set) — never null, so the UI always has something to show.</summary>
    public string CashChartCode { get; set; } = string.Empty;
    public string? CashChartName { get; set; }
    public string CollectionIncomeChartCode { get; set; } = string.Empty;
    public string? CollectionIncomeChartName { get; set; }

    /// <summary>True only when an admin has explicitly overridden the appsettings default via this page.</summary>
    public bool CashChartCodeIsOverridden { get; set; }
    public bool CollectionIncomeChartCodeIsOverridden { get; set; }

    /// <summary>The 2 club-wide jersey colors matches are assigned from — the club only owns 2 physical jerseys.</summary>
    public string JerseyColorA { get; set; } = "red";
    public string JerseyColorB { get; set; } = "yellow";
}
