using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auth.Models;

/// <summary>
/// No OldPassword field - this is for the mandatory first-login/expired-password
/// reset flow only (see AuthService.ForcePasswordResetAsync's IsResetPasswordNeeded
/// guard), where the caller just authenticated moments ago to reach this screen.
/// The regular ChangePasswordRequest flow (voluntary password change from the
/// profile/settings UI) still requires OldPassword as normal.
/// </summary>
public class ForcePasswordResetRequest
{
    [Required(ErrorMessage = "newPassword is mandatory")]
    public string NewPassword { get; set; } = string.Empty;
}
