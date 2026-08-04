using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of controller/account/CostTypeController.java.</summary>
[ApiController]
[Route("cost-types")]
[Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
public class CostTypeController(CostTypeService service) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> SaveCostType([FromBody] CostTypeRequest request)
    {
        await service.SaveCostTypeAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCostType()
    {
        var costTypes = await service.GetAllCostTypeAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, costTypes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCostTypeById(long id)
    {
        var costType = await service.GetByCostIdAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, costType);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateCostTypeStatus(long id, [FromQuery] bool isActive)
    {
        await service.UpdateStatusAsync(id, isActive);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.StatusUpdateOk);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCostType(long id, [FromBody] CostTypeRequest request)
    {
        var updated = await service.UpdateAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updated);
    }
}
