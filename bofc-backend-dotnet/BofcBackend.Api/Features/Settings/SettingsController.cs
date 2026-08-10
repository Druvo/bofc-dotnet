using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Settings.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Settings;

[ApiController]
[Route("settings")]
[Authorize]
public class SettingsController(ISettingsService settingsService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await settingsService.GetSettingsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, settings);
    }

    [HttpPut]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSystemSettingsRequest request)
    {
        var settings = await settingsService.UpdateSettingsAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, settings);
    }

    [HttpPost("test-email")]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
    {
        await settingsService.SendTestEmailAsync(request.ToEmail);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk);
    }

    /// <summary>Any authenticated user - lets the topbar hide its per-user push toggle when the admin has disabled push club-wide.</summary>
    [HttpGet("push-notifications-enabled")]
    public async Task<IActionResult> GetPushNotificationsEnabled()
    {
        var enabled = await settingsService.GetPushNotificationsEnabledAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, enabled);
    }

    /// <summary>Runs the weekly-match slot generator (and team auto-draft, if enabled) immediately instead of waiting for the hourly tick - for testing.</summary>
    [HttpPost("weekly-match/generate-now")]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> GenerateWeeklyMatchesNow()
    {
        var result = await settingsService.GenerateWeeklyMatchesNowAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, result);
    }

    /// <summary>Force-drafts teams for one MatchDay right now, bypassing the configured lead-time wait - for testing.</summary>
    [HttpPost("weekly-match/{matchDayId}/generate-teams-now")]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> GenerateTeamsNow(long matchDayId)
    {
        var result = await settingsService.GenerateTeamsNowAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, result);
    }

}
