using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of controller/account/AcChartController.java.</summary>
[ApiController]
[Route("ac/charts")]
[Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
public class AcChartController(AcChartService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAcCharts()
    {
        var charts = await service.GetAcChartsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, charts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAcChartById(long id)
    {
        var response = await service.GetAcChartResponseByIdAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpPost]
    public async Task<IActionResult> SaveAcChart([FromBody] AcChartRequest request)
    {
        var id = await service.SaveChartAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAcChart(long id, [FromBody] AcChartRequest request)
    {
        var updatedId = await service.UpdateChartAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updatedId);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAcChart(long id)
    {
        await service.DeleteChartAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.NoContent, RestResponseMessage.DeleteOk);
    }
}
