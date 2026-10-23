using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Scheduling;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.EmailTemplates;
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
    IEmailTemplateService emailTemplateService,
    IOptions<AccountingOptions> accountingOptions,
    WeeklyMatchDayTeamGenerator weeklyMatchDayTeamGenerator,
    ILogger<SettingsService> logger) : ISettingsService
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
        settings.MatchDayReminderRepeatHours = request.MatchDayReminderRepeatHours;
        settings.NotifyPaymentDueEnabled = request.NotifyPaymentDueEnabled;
        settings.PaymentDueReminderDayOfMonth = request.PaymentDueReminderDayOfMonth;
        settings.PaymentDueReminderRepeatDays = request.PaymentDueReminderRepeatDays;
        settings.NotifyCustomEmailEnabled = request.NotifyCustomEmailEnabled;
        settings.PushNotificationsEnabled = request.PushNotificationsEnabled;
        settings.MatchDayStatusCheckIntervalHours = request.MatchDayStatusCheckIntervalHours;
        settings.VotingLockEnabled = request.VotingLockEnabled;
        settings.VotingLockHoursBeforeMatch = request.VotingLockHoursBeforeMatch;

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
        settings.MinGoalkeepersPerTeam = request.MinGoalkeepersPerTeam;

        // Full replace - this is a small config list (max ~7 rows), not worth diffing.
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
                throw new BadRequestException("At least 2 jersey colors are required - the club needs 2 distinct colors to tell the teams in a match apart.");
            }
            if (normalizedColors.Distinct(StringComparer.OrdinalIgnoreCase).Count() != normalizedColors.Count)
            {
                throw new BadRequestException("Jersey colors must be unique - no duplicates.");
            }

            // Full replace - this is a small config list, not worth diffing.
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
            throw new BadRequestException("SMTP is not enabled - enable and save it before sending a test email.");
        }

        var result = await emailSender.SendAsync([toEmail], "BOFC - SMTP test email",
            "<p>This is a test email from the BOFC admin Settings page.</p><p>If you received this, your SMTP configuration is working.</p>");

        if (result.Sent == 0)
        {
            // Pass the underlying reason straight through. The mail server's own words
            // ("5.7.0 Authentication Required", "connection timed out") tell an admin what to
            // fix; the generic fallback below only applies when we genuinely have nothing.
            throw new BadRequestException(string.IsNullOrWhiteSpace(result.ErrorMessage)
                ? "Failed to send the test email - check the SMTP host/port/credentials and try again."
                : $"Failed to send the test email: {result.ErrorMessage}");
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

        var createdMatchDays = await MatchDaySchedulerBackgroundService.GenerateForCurrentMonthAsync(db, settings, ClubTime.Now);

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

    public async Task<(int Due, int Sent)> SendPaymentDueReminderNowAsync(int? year, int? month)
    {
        var now = ClubTime.Now;
        var targetYear = year ?? now.Year;
        var targetMonth = month ?? now.Month;
        if (targetMonth is < 1 or > 12) throw new BadRequestException("month must be between 1 and 12.");

        var settings = await LoadOrCreateAsync();
        var result = await PaymentDueReminderBackgroundService.SendRemindersAsync(db, emailSender, emailTemplateService, logger, targetYear, targetMonth);

        // Only advances the scheduled reminder's own cadence when sending for the CURRENT month -
        // a manual send for a past/future month is a separate, one-off action that shouldn't
        // suppress the automatic current-month reminder for the next PaymentDueReminderRepeatDays.
        if (targetYear == now.Year && targetMonth == now.Month)
        {
            settings.LastPaymentReminderSentAt = now;
        }
        await db.SaveChangesAsync();
        return result;
    }

    private async Task<SystemSettings> LoadOrCreateAsync()
    {
        var settings = await db.SystemSettings
            .Include(s => s.WeeklyMatchDaySlots)
            .Include(s => s.JerseyColors)
            .AsSplitQuery()
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
            MatchDayReminderRepeatHours = s.MatchDayReminderRepeatHours,
            NotifyPaymentDueEnabled = s.NotifyPaymentDueEnabled,
            PaymentDueReminderDayOfMonth = s.PaymentDueReminderDayOfMonth,
            PaymentDueReminderRepeatDays = s.PaymentDueReminderRepeatDays,
            NotifyCustomEmailEnabled = s.NotifyCustomEmailEnabled,
            PushNotificationsEnabled = s.PushNotificationsEnabled,
            MatchDayStatusCheckIntervalHours = s.MatchDayStatusCheckIntervalHours,
            VotingLockEnabled = s.VotingLockEnabled,
            VotingLockHoursBeforeMatch = s.VotingLockHoursBeforeMatch,
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
            MinGoalkeepersPerTeam = s.MinGoalkeepersPerTeam,
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
