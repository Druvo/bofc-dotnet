using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of controller/account/AcNatureController.java.</summary>
[ApiController]
[Route("ac/natures")]
[Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
public class AcNatureController(AcNatureService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAcNatures()
    {
        var natures = await service.GetAcNaturesAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, natures);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAcNatureById(long id)
    {
        var nature = await service.GetAcNatureResponseAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, nature);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAcNature([FromBody] AcNatureRequest request)
    {
        var id = await service.SaveAcNatureAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAcNature(long id, [FromBody] AcNatureRequest request)
    {
        var updatedId = await service.UpdateAcNatureAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updatedId);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAcNature(long id)
    {
        await service.DeleteAcNatureAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }
}
