using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Settings.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Settings;

/// <summary>Single settings row (id=1), created lazily on first read so the app works before any admin has ever saved settings.</summary>
public class SettingsService(
    BofcDbContext db,
    IDataProtectionProvider dataProtectionProvider,
    IEmailSender emailSender,
    IOptions<AccountingOptions> accountingOptions) : ISettingsService
{
    private readonly IDataProtector protector = dataProtectionProvider.CreateProtector(SettingsEncryption.Purpose);

    public async Task<SystemSettingsResponse> GetSettingsAsync() => await ToDtoAsync(await LoadOrCreateAsync());

    public async Task<SystemSettingsResponse> UpdateSettingsAsync(UpdateSystemSettingsRequest request)
    {
        var settings = await LoadOrCreateAsync();

        settings.SmtpEnabled = request.SmtpEnabled;
        settings.SmtpHost = request.SmtpHost?.Trim();
        settings.SmtpPort = request.SmtpPort;
        settings.SmtpUsername = request.SmtpUsername?.Trim();
        settings.SmtpFromEmail = request.SmtpFromEmail?.Trim();
        settings.SmtpFromName = request.SmtpFromName?.Trim();
        settings.SmtpUseSsl = request.SmtpUseSsl;

        settings.NotifyTournamentReminderEnabled = request.NotifyTournamentReminderEnabled;
        settings.TournamentReminderDaysBefore = request.TournamentReminderDaysBefore;
        settings.NotifyPaymentDueEnabled = request.NotifyPaymentDueEnabled;
        settings.PaymentDueReminderDayOfMonth = request.PaymentDueReminderDayOfMonth;
        settings.NotifyCustomEmailEnabled = request.NotifyCustomEmailEnabled;
        settings.PushNotificationsEnabled = request.PushNotificationsEnabled;
        settings.AuctionEnabled = request.AuctionEnabled;

        // Null = leave the stored password untouched (the UI never re-sends it back).
        // Empty string = admin explicitly cleared the field, so wipe it.
        if (request.SmtpPassword != null)
        {
            settings.SmtpPasswordEncrypted = request.SmtpPassword.Length == 0
                ? null
                : protector.Protect(request.SmtpPassword);
        }

        if (request.WeeklyMatchEnabled && request.WeeklyMatchVenueId == null)
        {
            throw new BadRequestException("A venue is required to enable the weekly match");
        }

        settings.WeeklyMatchEnabled = request.WeeklyMatchEnabled;
        settings.WeeklyMatchNamePrefix = string.IsNullOrWhiteSpace(request.WeeklyMatchNamePrefix) ? "Next Match" : request.WeeklyMatchNamePrefix.Trim();
        settings.WeeklyMatchDayOfWeek = request.WeeklyMatchDayOfWeek;
        settings.WeeklyMatchTime = TimeSpan.Parse(request.WeeklyMatchTime);
        settings.WeeklyMatchVenueId = request.WeeklyMatchVenueId;
        settings.WeeklyMatchSportType = request.WeeklyMatchSportType;
        settings.WeeklyMatchDurationMinutes = request.WeeklyMatchDurationMinutes;
        settings.WeeklyMatchTimeGapMinutes = request.WeeklyMatchTimeGapMinutes;

        settings.CashChartCode = await NormalizeAndValidateChartCodeAsync(request.CashChartCode, "Cash chart");
        settings.CollectionIncomeChartCode = await NormalizeAndValidateChartCodeAsync(request.CollectionIncomeChartCode, "Collection income chart");

        settings.JerseyColorA = request.JerseyColorA.Trim();
        settings.JerseyColorB = request.JerseyColorB.Trim();

        await db.SaveChangesAsync();
        return await ToDtoAsync(settings);
    }

    /// <summary>Null/empty clears the override (falls back to appsettings). Otherwise the code must reference a real chart-of-account row.</summary>
    private async Task<string?> NormalizeAndValidateChartCodeAsync(string? code, string fieldLabel)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;

        var exists = await db.AcCharts.AnyAsync(c => c.Code == code);
        if (!exists)
        {
            throw new BadRequestException($"{fieldLabel}: no chart of account with code '{code}' exists");
        }

        return code;
    }

    public async Task SendTestEmailAsync(string toEmail)
    {
        var settings = await LoadOrCreateAsync();
        if (!settings.SmtpEnabled)
        {
            throw new BadRequestException("SMTP is not enabled — enable and save it before sending a test email.");
        }

        var result = await emailSender.SendAsync([toEmail], "BOFC — SMTP test email",
            "<p>This is a test email from the BOFC admin Settings page.</p><p>If you received this, your SMTP configuration is working.</p>");

        if (result.Sent == 0)
        {
            throw new BadRequestException("Failed to send the test email — check the SMTP host/port/credentials and try again.");
        }
    }

    private async Task<SystemSettings> LoadOrCreateAsync()
    {
        var settings = await db.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
        if (settings != null) return settings;

        settings = new SystemSettings { Id = 1 };
        db.SystemSettings.Add(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    private async Task<SystemSettingsResponse> ToDtoAsync(SystemSettings s)
    {
        string? venueName = null;
        if (s.WeeklyMatchVenueId != null)
        {
            venueName = await db.Venues.Where(v => v.Id == s.WeeklyMatchVenueId).Select(v => v.Name).FirstOrDefaultAsync();
        }

        var effectiveCashCode = string.IsNullOrWhiteSpace(s.CashChartCode) ? accountingOptions.Value.CashChartCode : s.CashChartCode;
        var effectiveCollectionCode = string.IsNullOrWhiteSpace(s.CollectionIncomeChartCode) ? accountingOptions.Value.CollectionIncomeChartCode : s.CollectionIncomeChartCode;

        var cashChartName = await db.AcCharts.Where(c => c.Code == effectiveCashCode).Select(c => c.Name).FirstOrDefaultAsync();
        var collectionChartName = await db.AcCharts.Where(c => c.Code == effectiveCollectionCode).Select(c => c.Name).FirstOrDefaultAsync();

        return new SystemSettingsResponse
        {
            SmtpEnabled = s.SmtpEnabled,
            SmtpHost = s.SmtpHost,
            SmtpPort = s.SmtpPort,
            SmtpUsername = s.SmtpUsername,
            SmtpPasswordSet = !string.IsNullOrEmpty(s.SmtpPasswordEncrypted),
            SmtpFromEmail = s.SmtpFromEmail,
            SmtpFromName = s.SmtpFromName,
            SmtpUseSsl = s.SmtpUseSsl,
            NotifyTournamentReminderEnabled = s.NotifyTournamentReminderEnabled,
            TournamentReminderDaysBefore = s.TournamentReminderDaysBefore,
            NotifyPaymentDueEnabled = s.NotifyPaymentDueEnabled,
            PaymentDueReminderDayOfMonth = s.PaymentDueReminderDayOfMonth,
            NotifyCustomEmailEnabled = s.NotifyCustomEmailEnabled,
            PushNotificationsEnabled = s.PushNotificationsEnabled,
            AuctionEnabled = s.AuctionEnabled,
            WeeklyMatchEnabled = s.WeeklyMatchEnabled,
            WeeklyMatchNamePrefix = s.WeeklyMatchNamePrefix,
            WeeklyMatchDayOfWeek = s.WeeklyMatchDayOfWeek.ToString(),
            WeeklyMatchTime = s.WeeklyMatchTime.ToString(@"hh\:mm"),
            WeeklyMatchVenueId = s.WeeklyMatchVenueId,
            WeeklyMatchVenueName = venueName,
            WeeklyMatchSportType = s.WeeklyMatchSportType.ToString(),
            WeeklyMatchDurationMinutes = s.WeeklyMatchDurationMinutes,
            WeeklyMatchTimeGapMinutes = s.WeeklyMatchTimeGapMinutes,
            CashChartCode = effectiveCashCode,
            CashChartName = cashChartName,
            CollectionIncomeChartCode = effectiveCollectionCode,
            CollectionIncomeChartName = collectionChartName,
            CashChartCodeIsOverridden = !string.IsNullOrWhiteSpace(s.CashChartCode),
            CollectionIncomeChartCodeIsOverridden = !string.IsNullOrWhiteSpace(s.CollectionIncomeChartCode),
            JerseyColorA = s.JerseyColorA,
            JerseyColorB = s.JerseyColorB,
        };
    }
}
