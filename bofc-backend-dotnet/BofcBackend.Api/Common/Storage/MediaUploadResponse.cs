namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// Port of model/TeamLogoUploadResponse.java - shared response shape for both
/// player-photo and team-logo presign endpoints (Java reused the same DTO for both).
/// </summary>
public class MediaUploadResponse
{
    public string Key { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string UploadUrl { get; set; } = string.Empty;
    public long ExpiresInSeconds { get; set; }
}
