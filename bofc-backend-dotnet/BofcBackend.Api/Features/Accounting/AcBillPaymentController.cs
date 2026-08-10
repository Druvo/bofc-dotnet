using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>
/// Port of controller/account/AcBillPaymentController.java. Roles are applied per-action (not
/// at the class level) because Java's class-level @PreAuthorize is fully OVERRIDDEN by any
/// method-level @PreAuthorize (three GETs here widen to PLAYER) - ASP.NET Core's [Authorize]
/// instead ANDs class-level and action-level attributes together, which would have silently
/// narrowed those three actions back down to admin-only. Same class of bug as the
/// AllowAnonymous/Authorize fix made earlier in StatisticsController.
/// </summary>
[ApiController]
[Route("ac/bill-payments")]
public class AcBillPaymentController(AcBillPaymentService service) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;
    private const string AdminSuperAdminPlayer = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Player;

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> SaveAcBillPayment([FromBody] AcBillPaymentRequest request)
    {
        var id = await service.SaveAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, id);
    }

    /// <summary>Returns a raw Spring-Data-Page-shaped body (not the usual envelope) - matches Java exactly.</summary>
    [Authorize(Roles = AdminSuperAdminPlayer)]
    [HttpGet("ajax-collections")]
    public async Task<IActionResult> GetAcBillPayments(
        [FromQuery] int page = 0, [FromQuery] int size = 10, [FromQuery] string? sortBy = null,
        [FromQuery] string? order = null, [FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        var result = await service.GetPaginatedAcBillPaymentsAsync(page, size, sortBy, order, year, month);
        return Ok(result);
    }

    [Authorize(Roles = AdminSuperAdminPlayer)]
    [HttpGet]
    public async Task<IActionResult> GetAllAcBillPayments()
    {
        var payments = await service.GetAllBillPaymentsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, payments);
    }

    [Authorize(Roles = AdminSuperAdminPlayer)]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetAcBillPaymentById(long id)
    {
        var entity = await service.GetAcBillPaymentEntityAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, service.GetAcBillPaymentResponse(entity));
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAcBillPayment(long id, [FromBody] AcBillPaymentRequest request)
    {
        var updatedId = await service.UpdateAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updatedId);
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAcBillPayment(long id)
    {
        await service.DeleteAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.NoContent, RestResponseMessage.DeleteOk);
    }
}
