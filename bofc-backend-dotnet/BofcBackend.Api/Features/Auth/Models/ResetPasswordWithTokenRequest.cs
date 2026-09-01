using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auth.Models;

/// <summary>Redeems a "forgot password" email link - the Token IS the caller's authentication,
/// there's no logged-in session and no OldPassword to check.</summary>
public class ResetPasswordWithTokenRequest
{
    [Required(ErrorMessage = "token is mandatory")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "newPassword is mandatory")]
    public string NewPassword { get; set; } = string.Empty;
}
