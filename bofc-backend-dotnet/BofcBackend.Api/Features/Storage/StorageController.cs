using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Storage;

/// <summary>Port of controller/StorageController.java - generic multi-folder storage (player-profile uploads).
///
/// Every action here used to be reachable anonymously: minting an upload URL, writing the file,
/// serving it back, and deleting it. Only serving is public now - the viewer and email clients
/// need it - and it goes out through SafeMediaServing so a stored file cannot be served as a
/// web page on this origin.</summary>
[ApiController]
[Route("files")]
public class StorageController([FromKeyedServices("player-profile")] IStorageProvider storageProvider) : ControllerBase
{
    [HttpPost("presign")]
    public async Task<IActionResult> Presign([FromQuery] string folder, [FromQuery] string fileName, [FromQuery] string contentType)
    {
        var response = await storageProvider.GenerateUploadUrlAsync(folder, fileName, contentType);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpGet("view-url")]
    public async Task<IActionResult> ViewUrl([FromQuery] string key)
    {
        var url = await storageProvider.GenerateViewUrlAsync(key);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk,
            new { url, expiresInSeconds = 3600 });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string key)
    {
        await storageProvider.DeleteAsync(key);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }

    [HttpPut("local/{**key}")]
    public async Task<IActionResult> LocalUpload(string key)
    {
        if (storageProvider is not LocalStorageProvider local)
        {
            return NotFound();
        }
        await local.Save(Uri.UnescapeDataString(key), Request.Body);
        return Ok();
    }

    // Public: player-profile images are rendered by the match-day viewer and by email clients,
    // neither of which can present a token.
    [AllowAnonymous]
    [HttpGet("local/{**key}")]
    public async Task<IActionResult> LocalServe(string key)
    {
        if (storageProvider is not LocalStorageProvider local)
        {
            return NotFound();
        }
        var decodedKey = Uri.UnescapeDataString(key);
        var fileName = decodedKey.Contains('/') ? decodedKey[(decodedKey.LastIndexOf('/') + 1)..] : decodedKey;
        try
        {
            var detectedContentType = await local.DetectContentType(decodedKey);
            var stream = await local.Load(decodedKey);
            Response.Headers.CacheControl = "private, max-age=3600";
            // Never the detected type directly - see SafeMediaServing.
            var contentType = SafeMediaServing.ApplyTo(Response, detectedContentType, fileName);
            return File(stream, contentType);
        }
        catch (Exception ex) when (ex is FileNotFoundException or DirectoryNotFoundException)
        {
            // Load opens the file eagerly, so a missing key used to surface as an unhandled
            // exception and a 500 - for what is simply a key that is not there.
            return NotFound();
        }
    }
}
