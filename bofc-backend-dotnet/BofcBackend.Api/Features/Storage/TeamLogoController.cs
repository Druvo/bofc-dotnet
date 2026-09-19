using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Storage;

/// <summary>Port of controller/TeamLogoController.java.</summary>
[ApiController]
[Route("files/team-logos")]
public class TeamLogoController([FromKeyedServices("team-logo")] IMediaStorageProvider provider) : ControllerBase
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

    // Public: team logos are rendered by the match-day viewer and by email clients, neither of
    // which can present a token. Everything else on this controller - minting an upload URL,
    // writing the file, deleting it - now requires a signed-in user via the global fallback
    // policy; all four used to be anonymous.
    [AllowAnonymous]
    [HttpGet("{key}")]
    public async Task<IActionResult> GetTeamLogo(string key)
    {
        ValidateKey(key);
        try
        {
            var stream = await provider.LoadAsync(key);
            var detectedContentType = await provider.DetectContentTypeAsync(key);
            Response.Headers.CacheControl = "public, max-age=86400";
            // The stored extension decides the detected type, and ValidateMeta only guards the
            // presign step - so never serve the detected type directly. See SafeMediaServing.
            var contentType = SafeMediaServing.ApplyTo(Response, detectedContentType, key);
            return File(stream, contentType);
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteTeamLogo([FromQuery] string key)
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
