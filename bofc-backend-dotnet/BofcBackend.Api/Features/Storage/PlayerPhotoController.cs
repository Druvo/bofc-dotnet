using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Storage;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Storage;

/// <summary>Port of controller/PlayerPhotoController.java.</summary>
[ApiController]
[Route("files/player-photos")]
public class PlayerPhotoController([FromKeyedServices("player-photo")] IMediaStorageProvider provider) : ControllerBase
{
    [HttpPost("presign")]
    public async Task<IActionResult> PresignUpload([FromQuery] string fileName, [FromQuery] string contentType)
    {
        ValidateMeta(fileName, contentType);
        var response = await provider.GenerateUploadUrlAsync(fileName, contentType);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Presigned URL generated", response);
    }

    [HttpPut("local/{key}")]
    public async Task<IActionResult> LocalUpload(string key)
    {
        if (provider is not LocalMediaStorageProvider)
        {
            return NotFound();
        }
        ValidateKey(key);
        await provider.SaveAsync(key, Request.Body);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Upload successful", new { key });
    }

    [HttpGet("{key}")]
    public async Task<IActionResult> GetPlayerPhoto(string key)
    {
        ValidateKey(key);
        try
        {
            var stream = await provider.LoadAsync(key);
            var contentType = await provider.DetectContentTypeAsync(key);
            Response.Headers.CacheControl = "public, max-age=86400";
            return File(stream, contentType);
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete]
    public async Task<IActionResult> DeletePlayerPhoto([FromQuery] string key)
    {
        ValidateKey(key);
        await provider.DeleteAsync(key);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Deleted", new { key });
    }

    private static void ValidateMeta(string? fileName, string? contentType)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("fileName is required");
        }
        if (contentType == null || !contentType.StartsWith("image/"))
        {
            throw new ArgumentException("Only image files are allowed");
        }
    }

    private static void ValidateKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Contains("..") || key.Contains('/') || key.Contains('\\'))
        {
            throw new ArgumentException("Invalid key");
        }
    }
}
