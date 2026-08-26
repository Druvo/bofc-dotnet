using BofcBackend.Api.Features.EmailTemplates.Models;

namespace BofcBackend.Api.Features.EmailTemplates;

public interface IEmailTemplateService
{
    /// <summary>Every template, lazily creating any of the fixed keys that don't have a row yet
    /// (same pattern as SystemSettings' single row) so the list is always complete.</summary>
    Task<List<EmailTemplateResponse>> GetAllAsync();

    Task<EmailTemplateResponse> UpdateAsync(long id, UpdateEmailTemplateRequest request);

    /// <summary>Overwrites Subject/Body back to the hardcoded default for that row's Key.</summary>
    Task<EmailTemplateResponse> ResetToDefaultAsync(long id);

    /// <summary>Fetches (lazily creating if missing) the template for <paramref name="key"/> and
    /// substitutes every "{{Placeholder}}" token in its Subject/Body from <paramref name="placeholders"/>.
    /// Used by the background services instead of hardcoding the email/notification text inline.</summary>
    Task<(string Subject, string Body)> RenderAsync(string key, Dictionary<string, string> placeholders);

    /// <summary>Renders the template with representative sample data, wrapped in the full branded
    /// HTML shell - what the Email Templates admin page's preview pane shows.</summary>
    Task<EmailTemplatePreviewResponse> PreviewAsync(long id);

    /// <summary>Renders with sample data and actually emails it to <paramref name="toEmail"/> so an
    /// admin can see the real rendered/branded result land in an inbox. For the Match Day Reminder
    /// template, its Yes/No vote links are genuine and clickable only if <paramref name="matchDayId"/>
    /// is provided (an upcoming MatchDay) - otherwise they're rendered as disabled-looking sample links.</summary>
    Task SendTestAsync(long id, string toEmail, long? matchDayId);
}
