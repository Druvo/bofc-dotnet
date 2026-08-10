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
}

/// <summary>Per-recipient outcome so a scheduler can log/skip individually instead of one failure aborting the whole batch.</summary>
public record EmailSendResult(int Sent, int Failed, bool SmtpConfigured);
