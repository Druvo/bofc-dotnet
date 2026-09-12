using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using BofcBackend.Api.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Common.Email;

public class EmailSender(
    BofcDbContext db,
    IDataProtectionProvider dataProtectionProvider,
    IOptions<AppUrlOptions> appUrlOptions,
    ILogger<EmailSender> logger)
    : IEmailSender
{
    private readonly IDataProtector protector = dataProtectionProvider.CreateProtector(SettingsEncryption.Purpose);

    public async Task<EmailSendResult> SendAsync(IEnumerable<string> toAddresses, string subject, string htmlBody)
    {
        var recipients = toAddresses.Where(a => !string.IsNullOrWhiteSpace(a)).Distinct().ToList();
        if (recipients.Count == 0) return new EmailSendResult(0, 0, true);

        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is not { SmtpEnabled: true } || string.IsNullOrWhiteSpace(settings.SmtpHost) || string.IsNullOrWhiteSpace(settings.SmtpFromEmail))
        {
            logger.LogWarning("SMTP is not enabled/configured - skipping email delivery for {Count} recipient(s)", recipients.Count);
            return new EmailSendResult(0, recipients.Count, false,
                "SMTP is not enabled, or the host/from-address is blank. Fill those in on the Settings page and save.");
        }

        string? password = null;
        if (!string.IsNullOrEmpty(settings.SmtpPasswordEncrypted))
        {
            try
            {
                password = protector.Unprotect(settings.SmtpPasswordEncrypted);
            }
            catch (CryptographicException ex)
            {
                // Abort rather than carry on with a null password. Continuing would hand the SMTP
                // server empty credentials, and the resulting "authentication failed" points every
                // diagnosis at the password itself instead of at the key ring that can no longer
                // read it - the stored secret may be perfectly correct and simply unreadable.
                logger.LogError(ex, "Stored SMTP password could not be decrypted - was it saved under a different data-protection key ring?");
                return new EmailSendResult(0, recipients.Count, true,
                    "The saved SMTP password could not be decrypted. This happens when the data-protection key ring "
                    + "changes (for example a redeploy under a different service user). Re-enter the password on the "
                    + "Settings page to store it under the current key.");
            }
        }

        using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort) { EnableSsl = settings.SmtpUseSsl };
        if (!string.IsNullOrWhiteSpace(settings.SmtpUsername))
        {
            client.Credentials = new NetworkCredential(settings.SmtpUsername, password);
        }

        var brandedBody = RenderBranded(subject, htmlBody);

        var sent = 0;
        var failed = 0;
        string? firstError = null;
        foreach (var recipient in recipients)
        {
            try
            {
                using var message = new MailMessage
                {
                    From = new MailAddress(settings.SmtpFromEmail, settings.SmtpFromName),
                    Subject = subject,
                    Body = brandedBody,
                    IsBodyHtml = true,
                };
                message.To.Add(recipient);
                await client.SendMailAsync(message);
                sent++;
            }
            catch (Exception ex)
            {
                failed++;
                // Keep the first failure's message: in a batch these are almost always the same
                // underlying cause (bad credentials, blocked port), and the SMTP server's own
                // wording - e.g. Gmail's "5.7.0 Authentication Required" - is the single most
                // useful thing to put in front of whoever has to fix it.
                firstError ??= ex.GetBaseException().Message;
                logger.LogWarning(ex, "Failed to send email to {Recipient}", recipient);
            }
        }

        if (failed > 0)
        {
            // Error, not Warning: a whole batch failing is an outage, and the per-recipient
            // warnings above scroll past unnoticed in a log this chatty.
            logger.LogError("SMTP delivery failed for {Failed} of {Total} recipient(s) via {Host}:{Port}. First error: {Error}",
                failed, recipients.Count, settings.SmtpHost, settings.SmtpPort, firstError);
        }

        return new EmailSendResult(sent, failed, true, firstError);
    }

    public Task<string> RenderPreviewAsync(string subject, string htmlBody) => Task.FromResult(RenderBranded(subject, htmlBody));

    private string RenderBranded(string subject, string htmlBody)
    {
        // Some templates (the current Payment/MatchDay reminders) are already complete,
        // self-branded HTML documents with their own header/footer baked in - wrapping those in
        // ANOTHER full <html> shell would nest two documents inside one email. Only wrap a body
        // that's a plain fragment (no <html> of its own), e.g. the Settings page's plain-text test email.
        if (IsFullHtmlDocument(htmlBody)) return htmlBody;

        var logoUrl = $"{appUrlOptions.Value.BaseUrl.TrimEnd('/')}/email/bofc-logo.png";
        return BrandedEmailRenderer.Render(subject, htmlBody, DefaultAccentColor, DefaultFooterTagline, logoUrl);
    }

    private const string DefaultAccentColor = "#1d4ed8";
    private const string DefaultFooterTagline = "Originals Football Club";

    private static bool IsFullHtmlDocument(string htmlBody)
    {
        var trimmed = htmlBody.TrimStart();
        return trimmed.StartsWith("<!doctype", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("<html", StringComparison.OrdinalIgnoreCase);
    }
}
