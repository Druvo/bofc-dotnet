using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auth.Models;

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "email is required")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "newPassword is mandatory")]
    public string NewPassword { get; set; } = string.Empty;
}
