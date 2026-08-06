using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Settings.Models;

public class TestEmailRequest
{
    [Required, EmailAddress]
    public string ToEmail { get; set; } = string.Empty;
}
