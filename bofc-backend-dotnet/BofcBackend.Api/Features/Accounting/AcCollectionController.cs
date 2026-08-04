using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>
/// Port of controller/account/AcCollectionController.java. Same per-action Authorize rationale
/// as AcBillPaymentController — two GETs here widen to PLAYER, which a class-level attribute
/// would incorrectly AND back down to admin-only in ASP.NET Core.
/// </summary>
[ApiController]
[Route("ac/collections")]
public class AcCollectionController(AcCollectionService service) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;
    private const string AdminSuperAdminPlayer = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Player;

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> SaveAcCollection([FromBody] PaymentCollectionRequest request)
    {
        var id = await service.SavePaymentCollectionAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, id);
    }

    [Authorize(Roles = AdminSuperAdminPlayer)]
    [HttpGet]
    public async Task<IActionResult> GetAllAcCollections()
    {
        var collections = await service.GetAllAcCollectionsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, collections);
    }

    [Authorize(Roles = AdminSuperAdminPlayer)]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetAcCollection(long id)
    {
        var entity = await service.GetAcCollectionByIdAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, service.GetAcCollectionResponse(entity));
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("costs")]
    public async Task<IActionResult> RecordCost([FromBody] MonthlyCostRequest request)
    {
        await service.RecordCostAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAcCollection(long id, [FromBody] PaymentCollectionRequest request)
    {
        var updatedId = await service.UpdatePaymentCollectionAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updatedId);
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAcCollection(long id)
    {
        await service.DeletePaymentCollectionAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.NoContent, RestResponseMessage.DeleteOk);
    }
}
