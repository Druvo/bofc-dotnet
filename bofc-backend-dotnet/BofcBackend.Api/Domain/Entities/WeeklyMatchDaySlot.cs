namespace BofcBackend.Api.Domain.Entities;

/// <summary>One configured "auto-create a MatchDay here every week" slot - day of week + kickoff
/// time + that MatchDay's own duration and inter-match gap (each weekly slot can run a different
/// length/spacing, e.g. Wednesday 90 min/2 min gap vs Saturday 120 min/5 min gap - previously
/// DurationMinutes and TimeGapMinutes were both shared across every slot on SystemSettings, which
/// couldn't express that). SystemSettings.MatchDaysPerWeek rows, one per weekly MatchDay. Not
/// audited (small config table owned entirely by SettingsService, same as SystemSettings itself).</summary>
public class WeeklyMatchDaySlot
{
    public long Id { get; set; }
    public long SystemSettingsId { get; set; }
    public SystemSettings SystemSettings { get; set; } = null!;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan Time { get; set; }
    public int DurationMinutes { get; set; } = 90;

    /// <summary>Length (minutes) of each individual auto-generated match within this slot's
    /// MatchDays - not this slot's own DurationMinutes above, which is the whole MatchDay.</summary>
    public int MatchDurationMinutes { get; set; } = 13;

    /// <summary>Gap (minutes) between each auto-generated match's start time within this slot's
    /// MatchDays - e.g. a 13-minute match on a 2-minute gap slots matches at :00, :15, :30...</summary>
    public int TimeGapMinutes { get; set; } = 15;

    public int SortOrder { get; set; }
}
