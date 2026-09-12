namespace BofcBackend.Api.Common.Email;

public interface IEmailSender
{
    /// <summary>
    /// Sends one email per recipient (never CC/BCC - recipients shouldn't see each other's
    /// addresses). Reads SMTP settings fresh from the DB on every call so an admin's change
    /// on the Settings page takes effect immediately, no app restart required. No-ops (logs
    /// a warning) if SMTP isn't enabled/configured - callers don't need to check first.
    /// <paramref name="inlineImages"/> are embedded as CID-referenced parts: the body can show
    /// them with &lt;img src="cid:..."&gt; and the recipient can still save them as files.
    /// </summary>
    Task<EmailSendResult> SendAsync(IEnumerable<string> toAddresses, string subject, string htmlBody,
        IReadOnlyList<EmailInlineImage>? inlineImages = null);

    /// <summary>Same as <see cref="SendAsync"/>, but each recipient gets their own subject and
    /// body over a <em>single</em> SMTP connection.
    ///
    /// The distinction is about connection count, not convenience. Calling SendAsync in a loop
    /// opens a fresh connection and TLS handshake per player, which is unnoticeable for a plain
    /// reminder and decidedly not for a mail carrying a megabyte of images: 28 of those stack up
    /// past the 100-second limit Cloudflare puts on an origin request, and the admin sees a 524
    /// while the send is still running.</summary>
    Task<EmailSendResult> SendPersonalizedAsync(IReadOnlyList<PersonalizedEmail> messages,
        IReadOnlyList<EmailInlineImage>? inlineImages = null);

    /// <summary>Renders the same branded HTML shell SendAsync wraps every email in, without
    /// actually sending anything - used by the Email Templates admin page to preview a template
    /// exactly as a recipient would see it.</summary>
    Task<string> RenderPreviewAsync(string subject, string htmlBody);
}

/// <summary>One recipient's copy, already rendered - see <see cref="IEmailSender.SendPersonalizedAsync"/>.</summary>
public record PersonalizedEmail(string ToAddress, string Subject, string HtmlBody);

/// <summary>An image embedded in the message rather than linked from a URL. Referenced from the
/// HTML body as <c>cid:{ContentId}</c>. Embedding matters here because the images are generated
/// per-send from live data - hosting them would mean writing throwaway files to a public URL, and
/// a linked image is also blocked by default in most mail clients while an inline one is not.</summary>
public record EmailInlineImage(string ContentId, string FileName, byte[] Content, string MediaType = "image/png");

/// <summary>Per-recipient outcome so a scheduler can log/skip individually instead of one failure
/// aborting the whole batch. <paramref name="ErrorMessage"/> carries the underlying reason for the
/// first failure (the SMTP server's own response, or a configuration problem) so callers can show
/// an admin what actually went wrong instead of a generic "check your settings" - the real message
/// used to exist only in a server log file, which is why a dead Gmail app password went
/// undiagnosed for days.</summary>
public record EmailSendResult(int Sent, int Failed, bool SmtpConfigured, string? ErrorMessage = null);
