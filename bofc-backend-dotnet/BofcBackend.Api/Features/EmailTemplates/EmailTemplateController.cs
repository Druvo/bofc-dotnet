using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.EmailTemplates.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.EmailTemplates;

[ApiController]
[Route("email-templates")]
[Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
public class EmailTemplateController(IEmailTemplateService emailTemplateService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var templates = await emailTemplateService.GetAllAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, templates);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateEmailTemplateRequest request)
    {
        var updated = await emailTemplateService.UpdateAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updated);
    }

    [HttpPost("{id}/reset")]
    public async Task<IActionResult> ResetToDefault(long id)
    {
        var reset = await emailTemplateService.ResetToDefaultAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, reset);
    }

    [HttpGet("{id}/preview")]
    public async Task<IActionResult> Preview(long id)
    {
        var preview = await emailTemplateService.PreviewAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, preview);
    }

    [HttpPost("{id}/test")]
    public async Task<IActionResult> SendTest(long id, [FromBody] SendTestEmailTemplateRequest request)
    {
        await emailTemplateService.SendTestAsync(id, request.ToEmail, request.MatchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }
}
