namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// One options shape shared by all 3 storage profiles (player-profile, player-photo,
/// team-logo) — consolidates config/StorageConfig.java, config/PlayerPhotoStorageConfig.java
/// and config/TeamLogoStorageConfig.java, which were near-identical.
/// </summary>
public class StorageOptions
{
    /// <summary>"local" or "r2".</summary>
    public string Provider { get; set; } = "local";

    public string UploadDir { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "http://localhost:9191";

    public string R2Endpoint { get; set; } = string.Empty;
    public string R2Bucket { get; set; } = string.Empty;
    public string R2AccessKey { get; set; } = string.Empty;
    public string R2SecretKey { get; set; } = string.Empty;
    public long R2PresignMinutes { get; set; } = 60;
}
