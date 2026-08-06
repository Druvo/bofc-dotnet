using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using BofcBackend.Api.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Email;

public class EmailSender(BofcDbContext db, IDataProtectionProvider dataProtectionProvider, ILogger<EmailSender> logger)
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
            logger.LogWarning("SMTP is not enabled/configured — skipping email delivery for {Count} recipient(s)", recipients.Count);
            return new EmailSendResult(0, recipients.Count, false);
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
                logger.LogError(ex, "Stored SMTP password could not be decrypted — was it saved under a different data-protection key ring?");
            }
        }

        using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort) { EnableSsl = settings.SmtpUseSsl };
        if (!string.IsNullOrWhiteSpace(settings.SmtpUsername))
        {
            client.Credentials = new NetworkCredential(settings.SmtpUsername, password);
        }

        var sent = 0;
        var failed = 0;
        foreach (var recipient in recipients)
        {
            try
            {
                using var message = new MailMessage
                {
                    From = new MailAddress(settings.SmtpFromEmail, settings.SmtpFromName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                };
                message.To.Add(recipient);
                await client.SendMailAsync(message);
                sent++;
            }
            catch (Exception ex)
            {
                failed++;
                logger.LogWarning(ex, "Failed to send email to {Recipient}", recipient);
            }
        }

        return new EmailSendResult(sent, failed, true);
    }
}
