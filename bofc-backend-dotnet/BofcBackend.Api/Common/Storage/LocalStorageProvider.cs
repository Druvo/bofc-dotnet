using System.Web;

namespace BofcBackend.Api.Common.Storage;

/// <summary>Port of storage/LocalStorageProvider.java.</summary>
public class LocalStorageProvider : IStorageProvider
{
    private readonly string _uploadRoot;
    private readonly string _baseUrl;

    public LocalStorageProvider(string uploadDir, string baseUrl)
    {
        _uploadRoot = Path.GetFullPath(uploadDir);
        _baseUrl = baseUrl;
    }

    public Task<PresignedUploadResponse> GenerateUploadUrlAsync(string folder, string originalName, string contentType)
    {
        var ext = ExtractExtension(originalName);
        var baseName = originalName.Contains('.') ? originalName[..originalName.LastIndexOf('.')] : originalName;
        var key = $"{folder}/{baseName}-{Guid.NewGuid().ToString()[..8]}{ext}";

        var encodedName = HttpUtility.UrlEncode(FileNameFromKey(key)).Replace("+", "%20");
        var uploadUrl = $"{_baseUrl}/files/local/{folder}/{encodedName}";

        return Task.FromResult(new PresignedUploadResponse { UploadUrl = uploadUrl, Key = key, ExpiresInSeconds = 3600 });
    }

    public Task<string> GenerateViewUrlAsync(string key)
    {
        var folder = key.Contains('/') ? key[..key.LastIndexOf('/')] : "";
        var encodedName = HttpUtility.UrlEncode(FileNameFromKey(key)).Replace("+", "%20");
        var url = $"{_baseUrl}/files/local/{(folder.Length == 0 ? "" : folder + "/")}{encodedName}";
        return Task.FromResult(url);
    }

    public Task DeleteAsync(string key)
    {
        try
        {
            File.Delete(ResolvePath(key));
        }
        catch
        {
            // Swallow delete errors to avoid breaking business flow, matches Java.
        }
        return Task.CompletedTask;
    }

    public async Task Save(string key, Stream data)
    {
        var target = ResolvePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(target)!);
        await using var fileStream = File.Create(target);
        await data.CopyToAsync(fileStream);
    }

    public Task<Stream> Load(string key) => Task.FromResult<Stream>(File.OpenRead(ResolvePath(key)));

    public Task<string> DetectContentType(string key)
    {
        var contentType = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider()
            .TryGetContentType(key, out var type)
            ? type
            : "application/octet-stream";
        return Task.FromResult(contentType);
    }

    private string ResolvePath(string key)
    {
        var sanitized = key.Replace('\\', '/').TrimStart('/');
        var target = Path.GetFullPath(Path.Combine(_uploadRoot, sanitized));
        if (!target.StartsWith(_uploadRoot, StringComparison.Ordinal))
        {
            throw new ArgumentException("Invalid file key");
        }
        return target;
    }

    private static string ExtractExtension(string fileName) =>
        fileName.Contains('.') ? fileName[fileName.LastIndexOf('.')..].ToLowerInvariant() : string.Empty;

    private static string FileNameFromKey(string key) =>
        key.Contains('/') ? key[(key.LastIndexOf('/') + 1)..] : key;
}
