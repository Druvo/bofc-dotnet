using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Auth;

/// <summary>Port of controller/AuthController.java. Route has no "api" prefix - see the
/// frontend contract notes in the migration plan (proxy strips /api before it reaches here).</summary>
[ApiController]
[Route("auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await authService.LoginAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.LoginOk, response);
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        await authService.ChangePasswordAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    [Authorize]
    [HttpPut("force-password-reset")]
    public async Task<IActionResult> ForcePasswordReset([FromBody] ForcePasswordResetRequest request)
    {
        await authService.ForcePasswordResetAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        await authService.ResetPasswordAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    /// <summary>"Forgot password?" on the login page. Always returns success - see
    /// AuthService.RequestPasswordResetAsync's doc comment on why.</summary>
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await authService.RequestPasswordResetAsync(request.Email);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    /// <summary>Redeems the link from the "forgot password" email.</summary>
    [AllowAnonymous]
    [HttpPost("reset-password-with-token")]
    public async Task<IActionResult> ResetPasswordWithToken([FromBody] ResetPasswordWithTokenRequest request)
    {
        await authService.ResetPasswordWithTokenAsync(request.Token, request.NewPassword);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }
}
