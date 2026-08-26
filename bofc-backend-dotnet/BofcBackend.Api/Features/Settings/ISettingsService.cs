using BofcBackend.Api.Features.Settings.Models;

namespace BofcBackend.Api.Features.Settings;

public interface ISettingsService
{
    Task<SystemSettingsResponse> GetSettingsAsync();

    Task<SystemSettingsResponse> UpdateSettingsAsync(UpdateSystemSettingsRequest request);

    /// <summary>Sends a real email through the currently-saved SMTP config so an admin can verify credentials before relying on them.</summary>
    Task SendTestEmailAsync(string toEmail);

    /// <summary>Just the one flag, readable by any authenticated user (not admin-gated like the rest of settings).</summary>
    Task<bool> GetPushNotificationsEnabledAsync();

    /// <summary>Just the one flag, readable by any authenticated user (not admin-gated like the rest of settings).</summary>
    Task<bool> GetAuctionEnabledAsync();

    /// <summary>Runs the same slot-generation + due-team-drafting logic as the hourly background
    /// scheduler, on demand - lets an admin verify the feature works without waiting an hour.</summary>
    Task<GenerateWeeklyMatchesResponse> GenerateWeeklyMatchesNowAsync();

    /// <summary>Force-drafts teams (and schedules their fixtures + jerseys) for one specific
    /// MatchDay right now, bypassing the configured lead-time wait - lets an admin test the full
    /// auto-generation flow without waiting until kickoff.</summary>
    Task<BofcBackend.Api.Common.Scheduling.TeamGenerationResult> GenerateTeamsNowAsync(long matchDayId);

    /// <summary>Emails+notifies every active player still unpaid for <paramref name="year"/>/<paramref name="month"/>
    /// (both default to the current month if omitted) right now, bypassing the day-of-month/
    /// repeat-interval gates the scheduled reminder is normally subject to - the "Send Payment Due
    /// Email" button (with its month picker, defaulting to the current month) on the Player
    /// Monthly Payments page. Due/Sent are returned separately so a caller can tell "nobody owed
    /// anything" apart from "owed but SMTP isn't configured" - both look like Sent=0 otherwise.</summary>
    Task<(int Due, int Sent)> SendPaymentDueReminderNowAsync(int? year, int? month);
}
