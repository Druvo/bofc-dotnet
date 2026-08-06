using BofcBackend.Api.Features.Settings.Models;

namespace BofcBackend.Api.Features.Settings;

public interface ISettingsService
{
    Task<SystemSettingsResponse> GetSettingsAsync();

    Task<SystemSettingsResponse> UpdateSettingsAsync(UpdateSystemSettingsRequest request);

    /// <summary>Sends a real email through the currently-saved SMTP config so an admin can verify credentials before relying on them.</summary>
    Task SendTestEmailAsync(string toEmail);
}
