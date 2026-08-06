using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Settings.Models;

public class UpdateSystemSettingsRequest
{
    public bool SmtpEnabled { get; set; }

    [MaxLength(250)]
    public string? SmtpHost { get; set; }

    [Range(1, 65535)]
    public int SmtpPort { get; set; } = 587;

    [MaxLength(250)]
    public string? SmtpUsername { get; set; }

    /// <summary>Null/omitted = keep the currently stored password. Empty string = clear it. Non-empty = replace it.</summary>
    public string? SmtpPassword { get; set; }

    [MaxLength(250)]
    public string? SmtpFromEmail { get; set; }

    [MaxLength(150)]
    public string? SmtpFromName { get; set; }

    public bool SmtpUseSsl { get; set; } = true;

    public bool NotifyMatchDayReminderEnabled { get; set; }

    [Range(1, 30)]
    public int MatchDayReminderDaysBefore { get; set; } = 3;

    public bool NotifyPaymentDueEnabled { get; set; }

    [Range(1, 28)]
    public int PaymentDueReminderDayOfMonth { get; set; } = 25;

    public bool NotifyCustomEmailEnabled { get; set; }

    public bool PushNotificationsEnabled { get; set; } = true;

    public bool AuctionEnabled { get; set; } = true;

    public bool WeeklyMatchEnabled { get; set; }

    [MaxLength(100)]
    public string WeeklyMatchNamePrefix { get; set; } = "Next Match";

    public DayOfWeek WeeklyMatchDayOfWeek { get; set; } = DayOfWeek.Friday;

    /// <summary>"HH:mm", 24-hour local time — e.g. "19:00".</summary>
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "weeklyMatchTime must be HH:mm (24-hour)")]
    public string WeeklyMatchTime { get; set; } = "19:00";

    /// <summary>Required only when WeeklyMatchEnabled is true — enforced in SettingsService, not here, so saving other settings sections isn't blocked before weekly match is ever configured.</summary>
    public long? WeeklyMatchVenueId { get; set; }

    public SportType WeeklyMatchSportType { get; set; } = SportType.FOOTBALL;

    [Range(15, 300)]
    public int WeeklyMatchDurationMinutes { get; set; } = 90;

    [Range(1, 120)]
    public int WeeklyMatchTimeGapMinutes { get; set; } = 15;

    /// <summary>Null/empty = clear the override, fall back to the Accounting:CashChartCode appsettings default.</summary>
    public string? CashChartCode { get; set; }

    /// <summary>Null/empty = clear the override, fall back to the Accounting:CollectionIncomeChartCode appsettings default.</summary>
    public string? CollectionIncomeChartCode { get; set; }

    [Required, MaxLength(30)]
    public string JerseyColorA { get; set; } = "red";

    [Required, MaxLength(30)]
    public string JerseyColorB { get; set; } = "yellow";
}
