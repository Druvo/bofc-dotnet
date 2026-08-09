using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Scheduling;
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
    IOptions<AccountingOptions> accountingOptions,
    WeeklyMatchDayTeamGenerator weeklyMatchDayTeamGenerator) : ISettingsService
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

        settings.NotifyMatchDayReminderEnabled = request.NotifyMatchDayReminderEnabled;
        settings.MatchDayReminderDaysBefore = request.MatchDayReminderDaysBefore;
        settings.NotifyPaymentDueEnabled = request.NotifyPaymentDueEnabled;
        settings.PaymentDueReminderDayOfMonth = request.PaymentDueReminderDayOfMonth;
        settings.NotifyCustomEmailEnabled = request.NotifyCustomEmailEnabled;
        settings.PushNotificationsEnabled = request.PushNotificationsEnabled;
        settings.AuctionEnabled = request.AuctionEnabled;
        settings.MatchDayStatusCheckIntervalHours = request.MatchDayStatusCheckIntervalHours;

        // Null = leave the stored password untouched (the UI never re-sends it back).
        // Empty string = admin explicitly cleared the field, so wipe it.
        if (request.SmtpPassword != null)
        {
            settings.SmtpPasswordEncrypted = request.SmtpPassword.Length == 0
                ? null
                : protector.Protect(request.SmtpPassword);
        }

        if (request.WeeklyMatchDayEnabled && request.WeeklyMatchDayVenueId == null)
        {
            throw new BadRequestException("A venue is required to enable the weekly match");
        }

        if (request.WeeklyMatchDayEnabled && request.WeeklyMatchDaySlots.Count == 0)
        {
            throw new BadRequestException("At least one match day/time is required to enable the weekly match");
        }

        settings.WeeklyMatchDayEnabled = request.WeeklyMatchDayEnabled;
        settings.WeeklyMatchDayNamePrefix = string.IsNullOrWhiteSpace(request.WeeklyMatchDayNamePrefix) ? "Next Match" : request.WeeklyMatchDayNamePrefix.Trim();
        settings.WeeklyMatchDayVenueId = request.WeeklyMatchDayVenueId;
        settings.WeeklyMatchDaySportType = request.WeeklyMatchDaySportType;
        settings.MatchDaysPerWeek = request.MatchDaysPerWeek;
        settings.WeeklyMatchDayMaxPlayersPerTeam = request.WeeklyMatchDayMaxPlayersPerTeam;
        settings.WeeklyMatchDayAutoTeamsEnabled = request.WeeklyMatchDayAutoTeamsEnabled;
        settings.WeeklyMatchDayAutoTeamsLeadHours = request.WeeklyMatchDayAutoTeamsLeadHours;

        // Full replace — this is a small config list (max ~7 rows), not worth diffing.
        db.WeeklyMatchDaySlots.RemoveRange(settings.WeeklyMatchDaySlots);
        settings.WeeklyMatchDaySlots = request.WeeklyMatchDaySlots.Select((s, i) => new WeeklyMatchDaySlot
        {
            SystemSettingsId = settings.Id,
            DayOfWeek = s.DayOfWeek,
            Time = TimeSpan.Parse(s.Time),
            DurationMinutes = s.DurationMinutes,
            MatchDurationMinutes = s.MatchDurationMinutes,
            TimeGapMinutes = s.TimeGapMinutes,
            SortOrder = i,
        }).ToList();

        settings.CashChartCode = await NormalizeAndValidateChartCodeAsync(request.CashChartCode, "Cash chart");
        settings.CollectionIncomeChartCode = await NormalizeAndValidateChartCodeAsync(request.CollectionIncomeChartCode, "Collection income chart");

        if (request.JerseyColors != null)
        {
            var normalizedColors = request.JerseyColors
                .Select(c => c?.Trim())
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Select(c => c!)
                .ToList();

            if (normalizedColors.Count < 2)
            {
                throw new BadRequestException("At least 2 jersey colors are required — the club needs 2 distinct colors to tell the teams in a match apart.");
            }
            if (normalizedColors.Distinct(StringComparer.OrdinalIgnoreCase).Count() != normalizedColors.Count)
            {
                throw new BadRequestException("Jersey colors must be unique — no duplicates.");
            }

            // Full replace — this is a small config list, not worth diffing.
            db.JerseyColors.RemoveRange(settings.JerseyColors);
            settings.JerseyColors = normalizedColors.Select((c, i) => new JerseyColor
            {
                SystemSettingsId = settings.Id,
                Color = c,
                SortOrder = i,
            }).ToList();
        }

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

    public async Task<bool> GetPushNotificationsEnabledAsync() =>
        (await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1))?.PushNotificationsEnabled ?? true;

    public async Task<GenerateWeeklyMatchesResponse> GenerateWeeklyMatchesNowAsync()
    {
        var settings = await LoadOrCreateAsync();
        if (!settings.WeeklyMatchDayEnabled || settings.WeeklyMatchDayVenueId == null)
        {
            throw new BadRequestException("Enable the weekly match and select a venue before generating.");
        }
        if (settings.WeeklyMatchDaySlots.Count == 0)
        {
            throw new BadRequestException("At least one match day/time slot is required before generating.");
        }

        var createdMatchDays = await MatchDaySchedulerBackgroundService.GenerateForCurrentMonthAsync(db, settings, DateTime.Now);

        var teamsGenerated = settings.WeeklyMatchDayAutoTeamsEnabled
            ? await MatchDaySchedulerBackgroundService.GenerateDueTeamsAsync(
                db, weeklyMatchDayTeamGenerator, settings.WeeklyMatchDayMaxPlayersPerTeam, settings.WeeklyMatchDayAutoTeamsLeadHours)
            : 0;

        return new GenerateWeeklyMatchesResponse { MatchDaysCreated = createdMatchDays.Count, TeamsGenerated = teamsGenerated };
    }

    public async Task<TeamGenerationResult> GenerateTeamsNowAsync(long matchDayId)
    {
        var settings = await LoadOrCreateAsync();
        return await weeklyMatchDayTeamGenerator.GenerateAsync(matchDayId, settings.WeeklyMatchDayMaxPlayersPerTeam);
    }

    private async Task<SystemSettings> LoadOrCreateAsync()
    {
        var settings = await db.SystemSettings
            .Include(s => s.WeeklyMatchDaySlots)
            .Include(s => s.JerseyColors)
            .FirstOrDefaultAsync(s => s.Id == 1);
        if (settings != null) return settings;

        settings = new SystemSettings { Id = 1 };
        // Seed the same 2 defaults the old hardcoded JerseyColorA/JerseyColorB fields used to
        // have, so a fresh install isn't left with zero jersey colors configured.
        settings.JerseyColors.Add(new JerseyColor { SystemSettingsId = settings.Id, Color = "red", SortOrder = 0 });
        settings.JerseyColors.Add(new JerseyColor { SystemSettingsId = settings.Id, Color = "yellow", SortOrder = 1 });
        db.SystemSettings.Add(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    private async Task<SystemSettingsResponse> ToDtoAsync(SystemSettings s)
    {
        string? venueName = null;
        if (s.WeeklyMatchDayVenueId != null)
        {
            venueName = await db.Venues.Where(v => v.Id == s.WeeklyMatchDayVenueId).Select(v => v.Name).FirstOrDefaultAsync();
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
            NotifyMatchDayReminderEnabled = s.NotifyMatchDayReminderEnabled,
            MatchDayReminderDaysBefore = s.MatchDayReminderDaysBefore,
            NotifyPaymentDueEnabled = s.NotifyPaymentDueEnabled,
            PaymentDueReminderDayOfMonth = s.PaymentDueReminderDayOfMonth,
            NotifyCustomEmailEnabled = s.NotifyCustomEmailEnabled,
            PushNotificationsEnabled = s.PushNotificationsEnabled,
            AuctionEnabled = s.AuctionEnabled,
            MatchDayStatusCheckIntervalHours = s.MatchDayStatusCheckIntervalHours,
            WeeklyMatchDayEnabled = s.WeeklyMatchDayEnabled,
            WeeklyMatchDayNamePrefix = s.WeeklyMatchDayNamePrefix,
            WeeklyMatchDayOfWeek = (s.WeeklyMatchDaySlots.OrderBy(sl => sl.SortOrder).FirstOrDefault()?.DayOfWeek ?? s.WeeklyMatchDayOfWeek).ToString(),
            WeeklyMatchTime = (s.WeeklyMatchDaySlots.OrderBy(sl => sl.SortOrder).FirstOrDefault()?.Time ?? s.WeeklyMatchTime).ToString(@"hh\:mm"),
            WeeklyMatchDayVenueId = s.WeeklyMatchDayVenueId,
            WeeklyMatchDayVenueName = venueName,
            WeeklyMatchDaySportType = s.WeeklyMatchDaySportType.ToString(),
            MatchDaysPerWeek = s.MatchDaysPerWeek,
            WeeklyMatchDaySlots = s.WeeklyMatchDaySlots.OrderBy(sl => sl.SortOrder)
                .Select(sl => new WeeklyMatchDaySlotDto { DayOfWeek = sl.DayOfWeek, Time = sl.Time.ToString(@"hh\:mm"), DurationMinutes = sl.DurationMinutes, MatchDurationMinutes = sl.MatchDurationMinutes, TimeGapMinutes = sl.TimeGapMinutes })
                .ToList(),
            WeeklyMatchDayMaxPlayersPerTeam = s.WeeklyMatchDayMaxPlayersPerTeam,
            WeeklyMatchDayAutoTeamsEnabled = s.WeeklyMatchDayAutoTeamsEnabled,
            WeeklyMatchDayAutoTeamsLeadHours = s.WeeklyMatchDayAutoTeamsLeadHours,
            CashChartCode = effectiveCashCode,
            CashChartName = cashChartName,
            CollectionIncomeChartCode = effectiveCollectionCode,
            CollectionIncomeChartName = collectionChartName,
            CashChartCodeIsOverridden = !string.IsNullOrWhiteSpace(s.CashChartCode),
            CollectionIncomeChartCodeIsOverridden = !string.IsNullOrWhiteSpace(s.CollectionIncomeChartCode),
            JerseyColors = s.JerseyColors.OrderBy(j => j.SortOrder).Select(j => j.Color).ToList(),
        };
    }
}
