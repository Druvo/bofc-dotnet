using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of controller/account/AcVoucherTypeController.java.</summary>
[ApiController]
[Route("ac/voucher-types")]
[Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
public class AcVoucherTypeController(AcVoucherTypeService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAcVoucherTypes()
    {
        var types = await service.GetAcVoucherTypesAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, types);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAcVoucherTypeById(long id)
    {
        var response = await service.GetAcVoucherTypeResponseAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpPost]
    public async Task<IActionResult> SaveAcVoucherType([FromBody] AcVoucherTypeRequest request)
    {
        var id = await service.SaveAcVoucherTypeAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAcVoucherType(long id, [FromBody] AcVoucherTypeRequest request)
    {
        var updatedId = await service.UpdateAcVoucherTypeAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updatedId);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAcVoucherType(long id)
    {
        await service.DeleteAcVoucherTypeAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }
}
