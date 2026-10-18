using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.EmailTemplates;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Hourly check for UPCOMING MatchDays starting within Settings.MatchDayReminderDaysBefore, that
/// re-sends every Settings.MatchDayReminderRepeatHours - not just once - for as long as the
/// MatchDay is still upcoming. Each re-send only reaches players who haven't voted yet (no
/// MatchDayParticipant row for that MatchDay), so it naturally tapers off as RSVPs come in and
/// stops the moment the MatchDay starts (it drops out of the due-list entirely). Hourly (not
/// daily) so both the initial reminder and each re-send fire promptly even if the app was down
/// when a coarser check would have run.
/// </summary>
public class MatchDayReminderBackgroundService(IServiceScopeFactory scopeFactory, ILogger<MatchDayReminderBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        do
        {
            try
            {
                await RunOnceAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "MatchDay reminder scheduler run failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunOnceAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BofcDbContext>();
        var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        var emailTemplateService = scope.ServiceProvider.GetRequiredService<IEmailTemplateService>();
        var voteTokenService = scope.ServiceProvider.GetRequiredService<IMatchDayVoteTokenService>();
        var appUrlOptions = scope.ServiceProvider.GetRequiredService<IOptions<AppUrlOptions>>();

        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is not { NotifyMatchDayReminderEnabled: true }) return;

        var now = ClubTime.Now;
        var cutoff = now.AddDays(settings.MatchDayReminderDaysBefore);

        var dueMatchDays = await db.MatchDays
            .Where(t => t.IsActive && t.MatchDayStatus == MatchDayStatus.UPCOMING
                && t.MatchDayDate <= cutoff
                && t.MatchDayDate >= now
                && (t.ReminderSentAt == null || EF.Functions.DateDiffHour(t.ReminderSentAt.Value, now) >= settings.MatchDayReminderRepeatHours))
            .Include(t => t.Venue)
            .ToListAsync();

        if (dueMatchDays.Count == 0) return;

        var activePlayers = await db.Players.Where(p => p.IsActive && !p.IsPaused && p.EmailNotificationsEnabled)
            .Select(p => new ReminderPlayer(p.Id, p.Name, p.Email)).ToListAsync();
        if (activePlayers.Count == 0) return;

        foreach (var matchDay in dueMatchDays)
        {
            await SendForMatchDayAsync(db, emailSender, emailTemplateService, voteTokenService, appUrlOptions, logger, matchDay, activePlayers, now);
        }

        await db.SaveChangesAsync();
    }

    /// <summary>Core per-MatchDay send, shared by the hourly scheduler above and the manual
    /// "Send Reminder" button on Team Building (see TeamService.SendMatchDayReminderNowAsync).
    /// Caller owns the SaveChangesAsync - this only stages entity changes.</summary>
    public static async Task<int> SendForMatchDayAsync(
        BofcDbContext db,
        IEmailSender emailSender,
        IEmailTemplateService emailTemplateService,
        IMatchDayVoteTokenService voteTokenService,
        IOptions<AppUrlOptions> appUrlOptions,
        ILogger logger,
        MatchDay matchDay,
        List<ReminderPlayer> activePlayers,
        DateTime now)
    {
        var baseUrl = appUrlOptions.Value.BaseUrl.TrimEnd('/');

        // Only players who haven't voted yet - a "yes" or a "no" both count as having
        // answered, so neither gets nagged again; only the still-silent get re-reminded.
        var votedPlayerIds = (await db.MatchDayParticipants
            .Where(p => p.MatchDayId == matchDay.Id)
            .Select(p => p.PlayerId)
            .ToListAsync())
            .ToHashSet();
        var targetPlayers = activePlayers.Where(p => !votedPlayerIds.Contains(p.Id)).ToList();

        // Nothing to send: everyone has already voted. Still advance the "last sent" marker, so
        // the interval check above doesn't re-query this Match Day on every single tick.
        if (targetPlayers.Count == 0)
        {
            matchDay.ReminderSentAt = now;
            return 0;
        }

        // The vote link must keep working right up to kickoff (the vote endpoint itself
        // rejects a past MatchDayDate) plus a little slack for clock drift/mail delay.
        var tokenLifetime = (matchDay.MatchDayDate - now).Add(TimeSpan.FromHours(6));
        if (tokenLifetime < TimeSpan.FromHours(1)) tokenLifetime = TimeSpan.FromHours(1);

        // In-app notification text is short/plain, independent of the templated email body
        // (which is now a full standalone HTML document, not something to dump into a
        // notification card).
        var notification = new Notification
        {
            Title = matchDay.Name,
            Body = $"Starts {matchDay.MatchDayDate:MMMM d, yyyy 'at' h:mm tt} at {matchDay.Venue.Name}. RSVP now.",
            TargetType = NotificationTargetType.ALL,
        };
        db.Notifications.Add(notification);
        db.NotificationRecipients.AddRange(targetPlayers.Select(p => new NotificationRecipient
        {
            Notification = notification,
            RecipientId = p.Id,
            IsRead = false,
        }));

        var sent = 0;

        // Personalized per player (not a single batch send) - each player's vote links must
        // be minted only for that player, so they can't be swapped to vote as someone else.
        foreach (var player in targetPlayers)
        {
            if (string.IsNullOrWhiteSpace(player.Email)) continue;

            var voteButtons = BuildVoteButtonsHtml(player.Id, matchDay.Id, tokenLifetime, baseUrl, voteTokenService);

            var (title, body) = await emailTemplateService.RenderAsync(
                EmailTemplateKeys.MatchDayReminder,
                new Dictionary<string, string>
                {
                    ["PlayerName"] = player.Name,
                    ["MatchDayName"] = matchDay.Name,
                    ["MatchDayDateTime"] = matchDay.MatchDayDate.ToString("MMMM d, yyyy 'at' h:mm tt"),
                    ["VenueName"] = matchDay.Venue.Name,
                    ["VoteButtons"] = voteButtons,
                });

            try
            {
                // Count what actually went out, not what we attempted. SendAsync swallows
                // per-recipient SMTP failures by design (one bad address mustn't abort the
                // batch), so an unconditional sent++ here reported a full batch as delivered
                // while every single message was being rejected.
                var result = await emailSender.SendAsync([player.Email], title, body);
                sent += result.Sent;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed emailing MatchDay reminder to player {PlayerId} for MatchDay {MatchDayId}", player.Id, matchDay.Id);
            }
        }

        // The marker moves only once something actually went out. It used to be advanced before
        // the sends, which meant a batch where every message failed still counted as "reminded"
        // and the next attempt was a full MatchDayReminderRepeatHours away - the reminder for
        // that Match Day could be silently lost for the day over a transient SMTP fault. Leaving
        // it untouched lets the next tick retry, which for an hourly scheduler is the difference
        // between one lost hour and one lost reminder.
        if (sent > 0)
        {
            matchDay.ReminderSentAt = now;
        }
        else
        {
            logger.LogError(
                "MatchDay reminder for {MatchDayId} reached none of its {Count} target player(s) - every send failed. "
                + "Check the SMTP settings; this will be retried on the next scheduler tick.",
                matchDay.Id, targetPlayers.Count);
        }

        return sent;
    }

    /// <summary>Two side-by-side buttons that stack full-width on mobile - reuses the ".stack"
    /// class already defined in the MatchDayReminder template's own &lt;style&gt; block, since
    /// this HTML gets inserted directly into that document in place of {{VoteButtons}}.</summary>
    private static string BuildVoteButtonsHtml(long playerId, long matchDayId, TimeSpan lifetime, string baseUrl, IMatchDayVoteTokenService voteTokenService)
    {
        var token = voteTokenService.CreateToken(playerId, matchDayId, lifetime);
        var encodedToken = Uri.EscapeDataString(token);
        var yesUrl = $"{baseUrl}/vote?token={encodedToken}&choice=yes";
        var noUrl = $"{baseUrl}/vote?token={encodedToken}&choice=no";

        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td class="stack" width="50%" style="padding:6px;">
            <a href="{yesUrl}" style="display:block;text-align:center;background:#2f9e1f;color:#ffffff;font-size:15px;line-height:20px;font-weight:900;border-radius:9px;padding:14px 10px;font-family:Arial,Helvetica,sans-serif;"><img src="{baseUrl}/email/icons/check.png" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;outline:none;width:16px;height:16px;">YES, I'M IN</a>
            </td>
            <td class="stack" width="50%" style="padding:6px;">
            <a href="{noUrl}" style="display:block;text-align:center;background:#e6e9ea;color:#17263a;font-size:15px;line-height:20px;font-weight:900;border-radius:9px;padding:14px 10px;font-family:Arial,Helvetica,sans-serif;"><img src="{baseUrl}/email/icons/cross.png" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;outline:none;width:16px;height:16px;">CAN'T MAKE IT</a>
            </td>
            </tr>
            </table>
            """;
    }

    /// <summary>Minimal projection of an eligible (active, email-notifications-on) player - shared
    /// between the scheduler's own query and TeamService.SendMatchDayReminderNowAsync's manual
    /// trigger, so neither has to pull the full Player entity just to email/notify.</summary>
    public sealed record ReminderPlayer(long Id, string Name, string Email);
}
