using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auth.Models;

public class LoginRequest
{
    [Required(ErrorMessage = "Email is mandatory")]
    [EmailAddress(ErrorMessage = "Email should be valid")]
    [MaxLength(255, ErrorMessage = "Email must be less than 255 characters")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "password is mandatory")]
    public string Password { get; set; } = string.Empty;
}
