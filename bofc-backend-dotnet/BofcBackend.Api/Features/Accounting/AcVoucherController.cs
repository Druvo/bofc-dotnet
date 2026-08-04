using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of controller/account/AcVoucherController.java.</summary>
[ApiController]
[Route("ac/vouchers")]
[Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
public class AcVoucherController(AcVoucherService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAllAcVouchers([FromQuery] bool? isDetailsResponse)
    {
        var vouchers = await service.GetAllAcVouchersAsync(isDetailsResponse);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, vouchers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAcVoucher(long id, [FromQuery] bool? isDetailsResponse)
    {
        var response = await service.GetAcVoucherResponseAsync(id, isDetailsResponse);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpPost]
    public async Task<IActionResult> SaveVoucher([FromBody] AcVoucherRequest request)
    {
        var id = await service.SaveVoucherAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVoucher(long id, [FromBody] AcVoucherRequest request)
    {
        var updatedId = await service.UpdateVoucherAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updatedId);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVoucher(long id)
    {
        await service.DeleteVoucherAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }
}
