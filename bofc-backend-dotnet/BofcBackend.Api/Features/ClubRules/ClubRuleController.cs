using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.ClubRules.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.ClubRules;

/// <summary>Port of controller/ClubRuleController.java.</summary>
[ApiController]
[Route("club-rules")]
public class ClubRuleController(IClubRuleService clubRuleService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> ClubRules()
    {
        var rules = await clubRuleService.GetRulesAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, rules);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> SaveClubRule([FromBody] ClubRuleRequest request)
    {
        await clubRuleService.SaveAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClubRule(long id, [FromBody] ClubRuleRequest request)
    {
        var updated = await clubRuleService.UpdateAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updated);
    }

    // NOTE: Java's ClubRuleController maps this to GET too, under @PreAuthorize(ADMIN/SUPERADMIN) —
    // reproduced as-is even though a GET-by-id gated to admins while the list endpoint is public
    // looks like an inconsistency; not this port's place to silently change access rules.
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetClubRule(long id)
    {
        var rule = await clubRuleService.GetByIdAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, rule);
    }
}
