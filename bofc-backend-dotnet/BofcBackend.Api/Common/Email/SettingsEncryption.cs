namespace BofcBackend.Api.Common.Email;

/// <summary>Shared IDataProtector purpose string — must match between SettingsService (encrypts on save) and EmailSender (decrypts on send).</summary>
public static class SettingsEncryption
{
    public const string Purpose = "BofcBackend.SystemSettings.Smtp";
}
