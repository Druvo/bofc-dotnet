using Amazon.S3;
using Amazon.S3.Model;

namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// Port of storage/R2StorageProvider.java. Talks to Cloudflare R2 (S3-compatible),
/// not real AWS S3 - same as the Java side (endpoint override + region "auto").
/// </summary>
public class R2StorageProvider : IStorageProvider
{
    private readonly string _bucket;
    private readonly long _presignMinutes;
    private readonly IAmazonS3 _client;

    public R2StorageProvider(string endpoint, string bucket, string accessKey, string secretKey, long presignMinutes)
    {
        _bucket = bucket;
        _presignMinutes = presignMinutes;
        _client = new AmazonS3Client(accessKey, secretKey, new AmazonS3Config
        {
            ServiceURL = endpoint,
            ForcePathStyle = true,
        });
    }

    public Task<PresignedUploadResponse> GenerateUploadUrlAsync(string folder, string originalName, string contentType)
    {
        var key = $"{folder}/{Guid.NewGuid()}{ExtractExtension(originalName)}";
        var url = _client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddMinutes(_presignMinutes),
        });
        return Task.FromResult(new PresignedUploadResponse
        {
            UploadUrl = url,
            Key = key,
            ExpiresInSeconds = _presignMinutes * 60,
        });
    }

    public Task<string> GenerateViewUrlAsync(string key)
    {
        var url = _client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddMinutes(_presignMinutes),
        });
        return Task.FromResult(url);
    }

    public async Task DeleteAsync(string key)
    {
        try
        {
            await _client.DeleteObjectAsync(_bucket, key);
        }
        catch
        {
            // Swallow delete errors - matches Java's log-and-continue behavior.
        }
    }

    private static string ExtractExtension(string fileName) =>
        fileName.Contains('.') ? fileName[fileName.LastIndexOf('.')..].ToLowerInvariant() : string.Empty;
}
