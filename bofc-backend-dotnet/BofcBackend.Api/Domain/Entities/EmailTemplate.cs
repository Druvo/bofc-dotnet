namespace BofcBackend.Api.Domain.Entities;

/// <summary>Admin-editable content for one of the app's system-generated emails (see
/// Domain/Constants/EmailTemplateKeys.cs for the fixed set of keys the code actually sends).
/// Subject/Body may contain "{{Placeholder}}" tokens - see EmailTemplateService's per-key
/// default definitions for what each template's placeholders are. Rows are lazily created
/// with their hardcoded default content the first time they're needed (same pattern as
/// SystemSettings' single row), not pre-seeded via migration - Key is never null.</summary>
public class EmailTemplate : AuditableEntity
{
    public long Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
