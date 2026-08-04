namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// Port of storage/PresignedUploadResponse.java — response shape for the generic
/// /files/presign endpoint. No "url" field (unlike MediaUploadResponse) — this matches
/// the Java response exactly, even though it differs from the player-photo/team-logo shape.
/// </summary>
public class PresignedUploadResponse
{
    public string UploadUrl { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public long ExpiresInSeconds { get; set; }
}
