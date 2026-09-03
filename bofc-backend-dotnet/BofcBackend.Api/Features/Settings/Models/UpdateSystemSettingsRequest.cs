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
    public int MatchDayReminderDaysBefore { get; set; } = 4;

    [Range(1, 168)]
    public int MatchDayReminderRepeatHours { get; set; } = 48;

    public bool NotifyPaymentDueEnabled { get; set; }

    [Range(1, 28)]
    public int PaymentDueReminderDayOfMonth { get; set; } = 5;

    [Range(1, 30)]
    public int PaymentDueReminderRepeatDays { get; set; } = 10;

    public bool NotifyCustomEmailEnabled { get; set; }

    public bool PushNotificationsEnabled { get; set; } = true;

    /// <summary>How often (hours) the background job re-checks and concludes overdue MatchDays.</summary>
    [Range(1, 24)]
    public int MatchDayStatusCheckIntervalHours { get; set; } = 1;

    public bool VotingLockEnabled { get; set; }

    /// <summary>How many hours before kickoff voting closes, once VotingLockEnabled is on.</summary>
    [Range(0, 168)]
    public int VotingLockHoursBeforeMatch { get; set; } = 5;

    public bool WeeklyMatchDayEnabled { get; set; }

    [MaxLength(100)]
    public string WeeklyMatchDayNamePrefix { get; set; } = "Next Match";

    public DayOfWeek WeeklyMatchDayOfWeek { get; set; } = DayOfWeek.Friday;

    /// <summary>"HH:mm", 24-hour local time - e.g. "19:00".</summary>
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "weeklyMatchTime must be HH:mm (24-hour)")]
    public string WeeklyMatchTime { get; set; } = "19:00";

    /// <summary>Required only when WeeklyMatchDayEnabled is true - enforced in SettingsService, not here, so saving other settings sections isn't blocked before the weekly MatchDay is ever configured.</summary>
    public long? WeeklyMatchDayVenueId { get; set; }

    public SportType WeeklyMatchDaySportType { get; set; } = SportType.FOOTBALL;

    [Range(1, 7)]
    public int MatchDaysPerWeek { get; set; } = 1;

    /// <summary>One entry per weekly MatchDay - length should match MatchDaysPerWeek (enforced in SettingsService, not here).</summary>
    public List<WeeklyMatchDaySlotDto> WeeklyMatchDaySlots { get; set; } = new();

    /// <summary>Max squad size per auto-drafted team (including goalkeeper) - the number of
    /// teams is derived at generation time from confirmed participant count, not fixed here.</summary>
    [Range(2, 11)]
    public int WeeklyMatchDayMaxPlayersPerTeam { get; set; } = 6;

    public bool WeeklyMatchDayAutoTeamsEnabled { get; set; }

    [Range(1, 168)]
    public int WeeklyMatchDayAutoTeamsLeadHours { get; set; } = 24;

    /// <summary>How many goalkeepers "Auto-Assign Goalkeepers" fills per team (starter + backup/rotation cover).</summary>
    [Range(1, 5)]
    public int MinGoalkeepersPerTeam { get; set; } = 2;

    /// <summary>Null/empty = clear the override, fall back to the Accounting:CashChartCode appsettings default.</summary>
    public string? CashChartCode { get; set; }

    /// <summary>Null/empty = clear the override, fall back to the Accounting:CollectionIncomeChartCode appsettings default.</summary>
    public string? CollectionIncomeChartCode { get; set; }

    /// <summary>The club's configured jersey colors - any count (was hardcoded to exactly 2).
    /// Validated in SettingsService: at least 2 required (need 2 distinct colors to tell the two
    /// teams in a match apart) and no duplicates.</summary>
    public List<string>? JerseyColors { get; set; }
}

public class WeeklyMatchDaySlotDto
{
    public DayOfWeek DayOfWeek { get; set; }

    /// <summary>"HH:mm", 24-hour local time.</summary>
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "time must be HH:mm (24-hour)")]
    public string Time { get; set; } = "19:00";

    /// <summary>How long THIS weekly MatchDay runs, in minutes - each slot has its own (e.g.
    /// Wednesday 90 min, Saturday 120 min), previously a single duration shared by every slot.</summary>
    [Range(15, 300)]
    public int DurationMinutes { get; set; } = 90;

    /// <summary>Length (minutes) of each individual auto-generated match within THIS slot's
    /// MatchDays - NOT the same as DurationMinutes above, which is the whole MatchDay's length.</summary>
    [Range(5, 180)]
    public int MatchDurationMinutes { get; set; } = 13;

    /// <summary>Gap (minutes) between each auto-generated match's start time within THIS slot's
    /// MatchDays - each slot has its own, previously a single gap shared by every slot.</summary>
    [Range(0, 120)]
    public int TimeGapMinutes { get; set; } = 15;
}
