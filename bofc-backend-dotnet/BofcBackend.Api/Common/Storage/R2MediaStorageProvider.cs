using Amazon.S3;
using Amazon.S3.Model;

namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// Port of storage/teamlogo/TeamLogoR2StorageProvider.java and
/// storage/playerphoto/PlayerPhotoR2StorageProvider.java (identical apart from prefix/route).
/// </summary>
public class R2MediaStorageProvider : IMediaStorageProvider
{
    private readonly IAmazonS3 _client;
    private readonly string _bucket;
    private readonly long _presignMinutes;
    private readonly string _keyPrefix;
    private readonly string _routeSegment;

    public R2MediaStorageProvider(string endpoint, string bucket, string accessKey, string secretKey,
        long presignMinutes, string keyPrefix, string routeSegment)
    {
        _bucket = bucket;
        _presignMinutes = presignMinutes;
        _keyPrefix = keyPrefix;
        _routeSegment = routeSegment;
        _client = new AmazonS3Client(accessKey, secretKey, new AmazonS3Config
        {
            ServiceURL = endpoint,
            ForcePathStyle = true,
        });
    }

    public Task<MediaUploadResponse> GenerateUploadUrlAsync(string fileName, string contentType)
    {
        var key = $"{_keyPrefix}{Guid.NewGuid()}{GetSafeExtension(fileName)}";
        var uploadUrl = _client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddMinutes(_presignMinutes),
        });

        return Task.FromResult(new MediaUploadResponse
        {
            Key = key,
            Url = $"/files/{_routeSegment}/{key}",
            UploadUrl = uploadUrl,
            ExpiresInSeconds = _presignMinutes * 60,
        });
    }

    public async Task<Stream> LoadAsync(string key)
    {
        var response = await _client.GetObjectAsync(_bucket, key);
        return response.ResponseStream;
    }

    public async Task<string> DetectContentTypeAsync(string key)
    {
        try
        {
            var response = await _client.GetObjectMetadataAsync(_bucket, key);
            return string.IsNullOrEmpty(response.Headers.ContentType) ? "application/octet-stream" : response.Headers.ContentType;
        }
        catch
        {
            return "application/octet-stream";
        }
    }

    public async Task DeleteAsync(string key)
    {
        try
        {
            await _client.DeleteObjectAsync(_bucket, key);
        }
        catch
        {
            // Swallow - matches Java's log-and-continue.
        }
    }

    public Task SaveAsync(string key, Stream data) =>
        throw new NotSupportedException("Direct save is only supported by the local storage provider");

    private static string GetSafeExtension(string? originalFileName)
    {
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            return ".png";
        }
        var dotIndex = originalFileName.LastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFileName.Length - 1)
        {
            return ".png";
        }
        var extension = originalFileName[dotIndex..].ToLowerInvariant();
        return System.Text.RegularExpressions.Regex.IsMatch(extension, @"^\.[a-z0-9]{1,10}$") ? extension : ".png";
    }
}
