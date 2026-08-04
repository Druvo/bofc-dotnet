using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auth.Models;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "oldPassword is mandatory")]
    public string OldPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "newPassword is mandatory")]
    public string NewPassword { get; set; } = string.Empty;
}
