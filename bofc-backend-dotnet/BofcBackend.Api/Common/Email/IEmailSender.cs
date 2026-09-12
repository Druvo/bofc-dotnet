namespace BofcBackend.Api.Common.Email;

public interface IEmailSender
{
    /// <summary>
    /// Sends one email per recipient (never CC/BCC - recipients shouldn't see each other's
    /// addresses). Reads SMTP settings fresh from the DB on every call so an admin's change
    /// on the Settings page takes effect immediately, no app restart required. No-ops (logs
    /// a warning) if SMTP isn't enabled/configured - callers don't need to check first.
    /// </summary>
    Task<EmailSendResult> SendAsync(IEnumerable<string> toAddresses, string subject, string htmlBody);

    /// <summary>Renders the same branded HTML shell SendAsync wraps every email in, without
    /// actually sending anything - used by the Email Templates admin page to preview a template
    /// exactly as a recipient would see it.</summary>
    Task<string> RenderPreviewAsync(string subject, string htmlBody);
}

/// <summary>Per-recipient outcome so a scheduler can log/skip individually instead of one failure
/// aborting the whole batch. <paramref name="ErrorMessage"/> carries the underlying reason for the
/// first failure (the SMTP server's own response, or a configuration problem) so callers can show
/// an admin what actually went wrong instead of a generic "check your settings" - the real message
/// used to exist only in a server log file, which is why a dead Gmail app password went
/// undiagnosed for days.</summary>
public record EmailSendResult(int Sent, int Failed, bool SmtpConfigured, string? ErrorMessage = null);
