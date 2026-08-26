namespace BofcBackend.Api.Features.EmailTemplates.Models;

public class EmailTemplateResponse
{
    public long Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    /// <summary>Every "{{Placeholder}}" token this template's Subject/Body can contain -
    /// shown in the UI so an admin editing it knows what's available, without needing to
    /// read the code that renders it.</summary>
    public List<string> AvailablePlaceholders { get; set; } = [];
}
