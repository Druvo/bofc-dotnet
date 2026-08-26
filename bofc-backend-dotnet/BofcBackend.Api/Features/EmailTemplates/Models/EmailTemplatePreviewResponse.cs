namespace BofcBackend.Api.Features.EmailTemplates.Models;

public class EmailTemplatePreviewResponse
{
    public string Subject { get; set; } = string.Empty;

    /// <summary>Full branded HTML document, ready to drop into an iframe's srcdoc.</summary>
    public string Html { get; set; } = string.Empty;
}
