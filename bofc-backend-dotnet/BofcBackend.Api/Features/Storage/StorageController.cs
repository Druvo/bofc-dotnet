using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Storage;

/// <summary>Port of controller/StorageController.java - generic multi-folder storage (player-profile uploads).</summary>
[ApiController]
[Route("files")]
public class StorageController([FromKeyedServices("player-profile")] IStorageProvider storageProvider) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("presign")]
    public async Task<IActionResult> Presign([FromQuery] string folder, [FromQuery] string fileName, [FromQuery] string contentType)
    {
        var response = await storageProvider.GenerateUploadUrlAsync(folder, fileName, contentType);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [AllowAnonymous]
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

    [AllowAnonymous]
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

    [AllowAnonymous]
    [HttpGet("local/{**key}")]
    public async Task<IActionResult> LocalServe(string key)
    {
        if (storageProvider is not LocalStorageProvider local)
        {
            return NotFound();
        }
        var decodedKey = Uri.UnescapeDataString(key);
        var contentType = await local.DetectContentType(decodedKey);
        var stream = await local.Load(decodedKey);
        Response.Headers.CacheControl = "private, max-age=3600";
        var fileName = decodedKey.Contains('/') ? decodedKey[(decodedKey.LastIndexOf('/') + 1)..] : decodedKey;
        Response.Headers.ContentDisposition = $"inline; filename=\"{fileName}\"";
        return File(stream, contentType);
    }
}
