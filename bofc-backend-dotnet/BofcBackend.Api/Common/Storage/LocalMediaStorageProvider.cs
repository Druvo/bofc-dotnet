using System.Text.RegularExpressions;

namespace BofcBackend.Api.Common.Storage;

/// <summary>
/// Port of storage/teamlogo/TeamLogoLocalStorageProvider.java and
/// storage/playerphoto/PlayerPhotoLocalStorageProvider.java - those were identical
/// except for keyPrefix ("team-logo-"/"player-photo-") and routeSegment
/// ("team-logos"/"player-photos"), which are now constructor parameters.
/// </summary>
public partial class LocalMediaStorageProvider : IMediaStorageProvider
{
    private readonly string _uploadPath;
    private readonly string _baseUrl;
    private readonly string _keyPrefix;
    private readonly string _routeSegment;

    public LocalMediaStorageProvider(string uploadDir, string baseUrl, string keyPrefix, string routeSegment)
    {
        _uploadPath = Path.GetFullPath(uploadDir);
        _baseUrl = TrimTrailingSlash(baseUrl);
        _keyPrefix = keyPrefix;
        _routeSegment = routeSegment;
    }

    public Task<MediaUploadResponse> GenerateUploadUrlAsync(string fileName, string contentType)
    {
        var key = $"{_keyPrefix}{Guid.NewGuid()}{GetSafeExtension(fileName)}";
        return Task.FromResult(new MediaUploadResponse
        {
            Key = key,
            Url = $"/files/{_routeSegment}/{key}",
            UploadUrl = $"{_baseUrl}/files/{_routeSegment}/local/{key}",
            ExpiresInSeconds = 3600,
        });
    }

    public async Task SaveAsync(string key, Stream data)
    {
        ValidateKey(key);
        Directory.CreateDirectory(_uploadPath);
        var destination = Path.GetFullPath(Path.Combine(_uploadPath, key));
        if (!destination.StartsWith(_uploadPath, StringComparison.Ordinal))
        {
            throw new ArgumentException("Invalid file path");
        }
        await using var fileStream = File.Create(destination);
        await data.CopyToAsync(fileStream);
    }

    public Task<Stream> LoadAsync(string key)
    {
        ValidateKey(key);
        var path = Path.GetFullPath(Path.Combine(_uploadPath, key));
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("File not found");
        }
        return Task.FromResult<Stream>(File.OpenRead(path));
    }

    public Task<string> DetectContentTypeAsync(string key)
    {
        ValidateKey(key);
        var path = Path.GetFullPath(Path.Combine(_uploadPath, key));
        var contentType = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider()
            .TryGetContentType(path, out var type)
            ? type
            : "application/octet-stream";
        return Task.FromResult(contentType);
    }

    public Task DeleteAsync(string key)
    {
        try
        {
            ValidateKey(key);
            var path = Path.GetFullPath(Path.Combine(_uploadPath, key));
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            // Swallow - matches Java's catch-and-ignore delete behavior.
        }
        return Task.CompletedTask;
    }

    private static void ValidateKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Contains("..") || key.Contains('/') || key.Contains('\\'))
        {
            throw new ArgumentException("Invalid key");
        }
    }

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
        return SafeExtensionPattern().IsMatch(extension) ? extension : ".png";
    }

    private static string TrimTrailingSlash(string value) =>
        string.IsNullOrWhiteSpace(value) ? "http://localhost:9191" : value.TrimEnd('/');

    [GeneratedRegex(@"^\.[a-z0-9]{1,10}$")]
    private static partial Regex SafeExtensionPattern();
}
