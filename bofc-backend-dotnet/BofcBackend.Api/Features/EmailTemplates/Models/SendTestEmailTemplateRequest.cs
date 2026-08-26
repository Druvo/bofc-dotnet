using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.EmailTemplates.Models;

public class SendTestEmailTemplateRequest
{
    [Required, EmailAddress, MaxLength(250)]
    public string ToEmail { get; set; } = string.Empty;

    /// <summary>Match Day Reminder template only - an upcoming MatchDay to generate genuine,
    /// clickable Yes/No vote links for. Ignored by every other template.</summary>
    public long? MatchDayId { get; set; }
}
