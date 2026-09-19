namespace BofcBackend.Api.Common.Storage;

/// <summary>How stored files are allowed to come back out over HTTP.
///
/// The file store serves player photos and team logos from the app's own origin, and those
/// responses have to stay anonymous - the public match-day viewer renders them, and so do email
/// clients. What made that dangerous was deriving the response's Content-Type from the stored
/// file's extension and sending it <c>inline</c>: anything ending in <c>.html</c> came back as
/// <c>text/html</c> on <c>originalsfootball.club</c> itself, which is script running on the app's
/// own origin with access to the session token in localStorage. There is no CSP on the origin to
/// fall back on.
///
/// Uploading now requires authentication, so reaching that state means an admin account, not a
/// stranger. This is the second line: whatever is on disk, the response is either a known-safe
/// image served inline, or an opaque download. A stored file can no longer decide it is a web
/// page.</summary>
public static class SafeMediaServing
{
    /// <summary>Raster formats only. SVG is deliberately absent: it is XML that may carry script,
    /// so serving it inline is the very thing this class exists to prevent - and nothing in the
    /// app uploads one.</summary>
    private static readonly HashSet<string> InlineImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/x-icon",
        "image/vnd.microsoft.icon",
    };

    private const string DownloadContentType = "application/octet-stream";

    /// <summary>The content type to actually send, and whether it may be shown inline.
    /// Anything not on the allowlist is downgraded to an opaque download rather than refused, so
    /// an unexpected file still reaches whoever asked for it - it just cannot execute.</summary>
    public static (string ContentType, bool Inline) Resolve(string? detectedContentType) =>
        detectedContentType is not null && InlineImageTypes.Contains(detectedContentType)
            ? (detectedContentType, true)
            : (DownloadContentType, false);

    /// <summary>Applies <see cref="Resolve"/> to a response and returns the content type to serve
    /// with. Always sets <c>nosniff</c>, so a browser cannot second-guess the downgrade by
    /// sniffing the bytes - without it, content sniffing would hand back the very interpretation
    /// this is removing.</summary>
    public static string ApplyTo(HttpResponse response, string? detectedContentType, string fileName)
    {
        var (contentType, inline) = Resolve(detectedContentType);
        response.Headers["X-Content-Type-Options"] = "nosniff";
        var disposition = inline ? "inline" : "attachment";
        response.Headers.ContentDisposition = $"{disposition}; filename=\"{SanitizeFileName(fileName)}\"";
        return contentType;
    }

    /// <summary>Keeps quotes, newlines and control characters out of the Content-Disposition
    /// header, which is built by string interpolation around a name that came from the request.</summary>
    private static string SanitizeFileName(string fileName)
    {
        var cleaned = new string(fileName.Where(c => !char.IsControl(c) && c != '"' && c != '\\').ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? "file" : cleaned;
    }
}
