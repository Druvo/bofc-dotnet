namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// Port of storage/StorageProvider.java — generic multi-folder storage, backing the
/// /files/presign + /files/view-url + /files/local/** endpoints (player-profile uploads).
/// </summary>
public interface IStorageProvider
{
    Task<PresignedUploadResponse> GenerateUploadUrlAsync(string folder, string originalName, string contentType);
    Task<string> GenerateViewUrlAsync(string key);
    Task DeleteAsync(string key);
}
