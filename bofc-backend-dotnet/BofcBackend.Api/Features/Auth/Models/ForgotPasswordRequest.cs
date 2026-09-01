using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auth.Models;

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
