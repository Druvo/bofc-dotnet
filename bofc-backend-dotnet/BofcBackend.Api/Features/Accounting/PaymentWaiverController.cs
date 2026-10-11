using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>"Omit payment" on the Player Monthly Payments page - see
/// <see cref="Domain.Entities.PaymentWaiver"/>. Admin-only, like recording a payment.</summary>
[ApiController]
[Route("ac/payment-waivers")]
[Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
public class PaymentWaiverController(PaymentWaiverService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetWaivers([FromQuery] int? year)
    {
        var waivers = await service.GetWaiversAsync(year);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, waivers);
    }

    [HttpPost]
    public async Task<IActionResult> Waive([FromBody] PaymentWaiverRequest request)
    {
        var waiver = await service.WaiveAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, waiver);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveWaiver(long id)
    {
        await service.RemoveWaiverAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }
}
