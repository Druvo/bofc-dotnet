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

    /// <summary>Runs the same slot-generation + due-team-drafting logic as the hourly background
    /// scheduler, on demand — lets an admin verify the feature works without waiting an hour.</summary>
    Task<GenerateWeeklyMatchesResponse> GenerateWeeklyMatchesNowAsync();

    /// <summary>Force-drafts teams (and schedules their fixtures + jerseys) for one specific
    /// MatchDay right now, bypassing the configured lead-time wait — lets an admin test the full
    /// auto-generation flow without waiting until kickoff.</summary>
    Task<BofcBackend.Api.Common.Scheduling.TeamGenerationResult> GenerateTeamsNowAsync(long matchDayId);
}
