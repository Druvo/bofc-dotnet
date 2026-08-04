namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// Consolidates storage/playerphoto/PlayerPhotoStorageProvider.java and
/// storage/teamlogo/TeamLogoStorageProvider.java — those two Java interfaces were
/// byte-for-byte identical in shape (only the key prefix and route segment differed),
/// so this single interface + two named instances (see Program.cs) replaces both.
/// </summary>
public interface IMediaStorageProvider
{
    Task<MediaUploadResponse> GenerateUploadUrlAsync(string fileName, string contentType);
    Task<Stream> LoadAsync(string key);
    Task<string> DetectContentTypeAsync(string key);
    Task DeleteAsync(string key);

    /// <summary>Local-only. R2 implementations throw NotSupportedException (matches Java's default UnsupportedOperationException).</summary>
    Task SaveAsync(string key, Stream data);
}
