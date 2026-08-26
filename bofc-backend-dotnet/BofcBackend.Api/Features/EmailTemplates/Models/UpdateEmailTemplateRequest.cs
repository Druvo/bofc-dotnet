using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.EmailTemplates.Models;

public class UpdateEmailTemplateRequest
{
    [Required(ErrorMessage = "Subject is mandatory")]
    [MaxLength(300, ErrorMessage = "Subject must be less than 300 characters")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Body is mandatory")]
    public string Body { get; set; } = string.Empty;
}
