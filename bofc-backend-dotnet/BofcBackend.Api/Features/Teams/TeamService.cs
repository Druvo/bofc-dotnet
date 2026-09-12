using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Scheduling;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Common.Storage;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.EmailTemplates;
using BofcBackend.Api.Features.Teams.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Teams;

/// <summary>Port of service/TeamManagementServiceImpl.java.</summary>
public class TeamService(
    BofcDbContext db,
    [FromKeyedServices("team-logo")] IMediaStorageProvider teamLogoStorageProvider,
    IEmailSender emailSender,
    IEmailTemplateService emailTemplateService,
    IMatchDayVoteTokenService voteTokenService,
    IOptions<AppUrlOptions> appUrlOptions,
    ILogger<TeamService> logger)
    : ITeamService
{
    public async Task<TeamResponse> CreateOrUpdateTeamAsync(TeamRequest request)
    {
        var matchDay = await GetMatchDayOrThrowAsync(request.MatchDayId!.Value);
        await ValidateMatchDayDateAsync(matchDay.Id);

        string? oldLogoKeyToDelete = null;
        Team team;
        if (request.Id == null)
        {
            var teamName = string.IsNullOrWhiteSpace(request.TeamName)
                ? await GenerateDefaultTeamNameAsync(matchDay.Id)
                : request.TeamName;
            team = new Team { TeamName = teamName, LogoKey = request.LogoKey, MatchDayId = matchDay.Id, MatchDay = matchDay };
            db.Teams.Add(team);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.TeamName))
            {
                throw new BadRequestException("Team name is required");
            }
            (team, oldLogoKeyToDelete) = await UpdateExistingTeamAsync(request, matchDay);
        }

        await db.SaveChangesAsync();

        // Only delete the old logo once the DB update has actually committed - deleting it
        // beforehand would leave a dangling reference if SaveChangesAsync failed.
        if (oldLogoKeyToDelete != null)
        {
            await TryAsync(() => teamLogoStorageProvider.DeleteAsync(oldLogoKeyToDelete), "delete replaced team logo");
        }

        return ConvertToTeamResponse(team, matchDay.Name);
    }

    /// <summary>Server is the authoritative source for the next default name (COUNT at insert
    /// time, same request/transaction) - the frontend used to compute this itself from a team
    /// count prop that lags behind an in-flight create until the list re-fetches, so two
    /// "+ Add Team" clicks close together both computed the same "next" letter (see
    /// CreateTeamComponent.tsx). Wraps to a number past 'Z' rather than emitting a non-letter
    /// character for the vanishingly rare 27th team.</summary>
    private async Task<string> GenerateDefaultTeamNameAsync(long matchDayId)
    {
        var count = await db.Teams.CountAsync(t => t.MatchDayId == matchDayId);
        return TeamNaming.DefaultName(count);
    }

    private async Task<(Team Team, string? OldLogoKeyToDelete)> UpdateExistingTeamAsync(TeamRequest request, MatchDay matchDay)
    {
        var team = await GetTeamOrThrowAsync(request.Id!.Value);
        var previousLogoKey = team.LogoKey;

        team.TeamName = request.TeamName!;
        if (request.LogoKey != null)
        {
            team.LogoKey = request.LogoKey;
        }

        team.MatchDayId = matchDay.Id;
        team.MatchDay = matchDay;

        var currentLogoKey = team.LogoKey;
        var oldLogoKeyToDelete = !string.IsNullOrWhiteSpace(previousLogoKey)
            && !string.IsNullOrWhiteSpace(currentLogoKey)
            && currentLogoKey != previousLogoKey
                ? previousLogoKey
                : null;

        return (team, oldLogoKeyToDelete);
    }

    public async Task DeleteTeamAsync(long teamId)
    {
        var team = await GetTeamOrThrowAsync(teamId);
        await ValidateMatchDayDateAsync(team.MatchDayId);

        var teamMatches = await db.Matches.Where(m => m.HomeTeamId == teamId || m.AwayTeamId == teamId).ToListAsync();
        if (teamMatches.Count > 0)
        {
            db.Matches.RemoveRange(teamMatches);
        }

        db.Teams.Remove(team);

        // If this was the last team on the MatchDay, clear the auto-team-generation flag too -
        // otherwise it stays stuck true forever with zero actual teams, permanently blocking the
        // "Generate Teams Now" test action (and the hourly scheduler) from ever regenerating.
        var isLastTeam = await db.Teams.CountAsync(t => t.MatchDayId == team.MatchDayId) == 1;
        if (isLastTeam)
        {
            var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == team.MatchDayId);
            if (matchDay != null)
            {
                matchDay.AutoTeamsGenerated = false;
            }
        }

        await db.SaveChangesAsync();

        // Best-effort cleanup - the team is already gone from the DB; a storage failure here
        // must not make this operation look like it failed.
        if (!string.IsNullOrWhiteSpace(team.LogoKey))
        {
            await TryAsync(() => teamLogoStorageProvider.DeleteAsync(team.LogoKey), "delete team logo");
        }
    }

    private async Task TryAsync(Func<Task> action, string description)
    {
        try
        {
            await action();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to {Description}", description);
        }
    }

    public async Task<TeamPlayerResponse> SaveOrUpdateTeamPlayerAsync(TeamPlayerRequest request)
    {
        var team = await GetTeamOrThrowAsync(request.TeamId!.Value);
        var player = await GetPlayerOrThrowAsync(request.PlayerId!.Value);

        var teamPlayer = request.Id == null
            ? await CreateTeamPlayerAsync(request, team, player)
            : await UpdateTeamPlayerAsync(request, team, player);

        if (request.Id == null)
        {
            db.TeamPlayers.Add(teamPlayer);
        }

        await db.SaveChangesAsync();
        return ConvertToTeamPlayerResponse(teamPlayer, team, player);
    }

    public async Task<TeamPlayerResponse> UpdateTeamPlayerDetailsAsync(TeamPlayerRequest request)
    {
        var team = await GetTeamOrThrowAsync(request.TeamId!.Value);
        var player = await GetPlayerOrThrowAsync(request.PlayerId!.Value);

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.TeamId == request.TeamId && tp.PlayerId == request.PlayerId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.PlayerIsNotPartOfThisTeam, HttpStatusCode.NotFound);

        var previousPosition = teamPlayer.PlayingPosition;
        var newPosition = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        if (previousPosition == FootballPosition.GOALKEEPER && newPosition != FootballPosition.GOALKEEPER)
        {
            await RemoveGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }
        else if (previousPosition != FootballPosition.GOALKEEPER && newPosition == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }

        if (request.IsCaptain == true)
        {
            await RemoveCaptainStatusFromOtherPlayersAsync(request.TeamId!.Value, request.PlayerId!.Value);
        }

        teamPlayer.PlayingPosition = newPosition;

        var newIsCaptain = request.IsCaptain ?? teamPlayer.IsCaptain;
        teamPlayer.IsCaptain = newIsCaptain;
        teamPlayer.TeamPlayerRole = newIsCaptain ? Domain.Enums.TeamPlayerRole.CAPTAIN : Domain.Enums.TeamPlayerRole.PLAYER;
        teamPlayer.JerseyNumber = request.JerseyNumber ?? teamPlayer.JerseyNumber;

        await db.SaveChangesAsync();
        return ConvertToTeamPlayerResponse(teamPlayer, team, player);
    }

    public async Task RemovePlayerFromTeamAsync(TeamPlayerRemoveRequest request)
    {
        var team = await GetTeamOrThrowAsync(request.TeamId!.Value);
        await ValidateMatchDayDateAsync(team.MatchDayId);
        var player = await GetPlayerOrThrowAsync(request.PlayerId!.Value);
        await RemoveGoalKeeperRoundAsync(player.Id, team.MatchDayId);

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.TeamId == request.TeamId && tp.PlayerId == request.PlayerId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.PlayerIsNotPartOfThisTeam, HttpStatusCode.NotFound);

        db.TeamPlayers.Remove(teamPlayer);
        await db.SaveChangesAsync();
    }

    /// <summary>Bulk-undo for AutoAssignGoalkeepersAsync: every team on this MatchDay with a
    /// goalkeeper set goes back to UNASSIGNED, and the matching PlayerGoalkeepingHistory rows for
    /// today are removed (same bookkeeping as the manual "Remove from Goalkeeper" action, just
    /// looped across every team). Teams with no goalkeeper set are left alone. Lets the organiser
    /// re-run the auto-assign ranking from a clean slate instead of clearing each team by hand.</summary>
    public async Task<ClearGoalkeepersResponse> ClearGoalkeepersAsync(long matchDayId)
    {
        var teams = await db.Teams.Include(t => t.TeamPlayers).ThenInclude(tp => tp.Player)
            .Where(t => t.MatchDayId == matchDayId)
            .ToListAsync();

        var cleared = new List<ClearedGoalkeeper>();
        foreach (var team in teams)
        {
            // A team can now carry more than one goalkeeper (see MinGoalkeepersPerTeam), so every
            // one of them - not just the first found - goes back to UNASSIGNED.
            var currentGoalkeepers = team.TeamPlayers.Where(tp => tp.PlayingPosition == FootballPosition.GOALKEEPER).ToList();
            foreach (var currentGoalkeeper in currentGoalkeepers)
            {
                currentGoalkeeper.PlayingPosition = FootballPosition.UNASSIGNED;
                await RemoveGoalKeeperRoundAsync(currentGoalkeeper.PlayerId, matchDayId);

                cleared.Add(new ClearedGoalkeeper
                {
                    TeamId = team.Id,
                    TeamName = team.TeamName,
                    PlayerId = currentGoalkeeper.PlayerId,
                    PlayerName = currentGoalkeeper.Player.Name,
                });
            }
        }

        await db.SaveChangesAsync();

        return new ClearGoalkeepersResponse { Cleared = cleared };
    }

    // Content ids the outgoing HTML points at with <img src="cid:...">. Stable strings rather
    // than per-send guids so an admin can hand-place the images in a customised template.
    private const string TeamsImageContentId = "bofc-teams";
    private const string ScheduleImageContentId = "bofc-schedule";

    // Generous next to a ~600KB render, but well under nginx's 10MB body cap, so a runaway
    // pixelRatio fails here with a clear message instead of as an opaque 413 at the proxy.
    private const int MaxImageBytes = 4 * 1024 * 1024;

    /// <summary>The "Declare Teams" button on Team Building - manually triggered only, never fired
    /// automatically off team/fixture generation. Emails every confirmed participant the line-ups
    /// and the schedule as two inline images, so "who am I playing with" is answered in the inbox
    /// without following a link, and still links through to the live page for whatever changes
    /// after the declaration.
    ///
    /// Two images rather than one wide graphic: the combined export was laid out to be read on a
    /// laptop, and arrives on a phone as an unreadable thumbnail.</summary>
    public async Task<DeclareTeamsResult> DeclareTeamsAsync(long matchDayId, DeclareTeamsRequest request)
    {
        var matchDay = await GetMatchDayOrThrowAsync(matchDayId);
        if (!await db.Teams.AnyAsync(t => t.MatchDayId == matchDayId))
        {
            throw new BadRequestException("Generate teams for this MatchDay before declaring them.");
        }

        var teamsImage = DecodeImageOrThrow(request.TeamsImageBase64, "team line-ups");
        var scheduleImage = DecodeImageOrThrow(request.ScheduleImageBase64, "schedule");

        var slug = SlugifyForFileName(matchDay.Name);
        var inlineImages = new List<EmailInlineImage>
        {
            new(TeamsImageContentId, $"{slug}-teams.png", teamsImage),
            new(ScheduleImageContentId, $"{slug}-schedule.png", scheduleImage),
        };

        var venueName = await db.Venues.Where(v => v.Id == matchDay.VenueId).Select(v => v.Name).FirstOrDefaultAsync() ?? "TBD";
        var teamBuildingUrl = $"{appUrlOptions.Value.WebsiteUrl.TrimEnd('/')}/match-days/join-match-day/{matchDay.Id}";

        var testAddresses = SplitAddresses(request.TestEmail);
        if (testAddresses.Count > 0)
        {
            // Deliberately no in-app notification and no participant lookup: a preview that
            // notified 28 people would defeat the point of previewing.
            //
            // Goes through the same SendPersonalizedAsync batch the real declaration uses, rather
            // than a simpler one-off send, so that timing a test against a realistic number of
            // addresses measures what the real thing will actually do.
            var testMessages = new List<PersonalizedEmail>();
            foreach (var address in testAddresses)
            {
                var (testSubject, testBody) = await RenderDeclarationAsync(
                    LocalPartAsName(address), matchDay.Name, matchDay.MatchDayDate, venueName, teamBuildingUrl);
                testMessages.Add(new PersonalizedEmail(address, testSubject, testBody));
            }

            var testResult = await emailSender.SendPersonalizedAsync(testMessages, inlineImages);
            return new DeclareTeamsResult(testResult.Sent, testResult.Failed, true, testResult.ErrorMessage);
        }

        var participants = await db.MatchDayParticipants
            .Include(p => p.Player)
            .Where(p => p.MatchDayId == matchDayId && p.ParticipationStatus)
            .Select(p => p.Player)
            .ToListAsync();
        if (participants.Count == 0)
        {
            return new DeclareTeamsResult(0, 0, false, "No confirmed participants to declare the teams to.");
        }

        var notification = new Notification
        {
            Title = matchDay.Name,
            Body = "Teams and fixtures are ready - check Team Building to see who you're playing with.",
            TargetType = NotificationTargetType.ALL,
        };
        db.Notifications.Add(notification);
        db.NotificationRecipients.AddRange(participants.Select(p => new NotificationRecipient
        {
            Notification = notification,
            RecipientId = p.Id,
            IsRead = false,
        }));
        await db.SaveChangesAsync();

        // Body is personalized per player, but rendered up front and handed over as one batch:
        // the in-app notifications above reach every participant regardless, while the email
        // itself still respects IsActive/EmailNotificationsEnabled, the same gate the other
        // reminder emails use.
        var outgoing = new List<PersonalizedEmail>();
        foreach (var player in participants)
        {
            if (string.IsNullOrWhiteSpace(player.Email)) continue;
            if (!player.IsActive || !player.EmailNotificationsEnabled) continue;

            var (subject, body) = await RenderDeclarationAsync(
                player.Name, matchDay.Name, matchDay.MatchDayDate, venueName, teamBuildingUrl);
            outgoing.Add(new PersonalizedEmail(player.Email, subject, body));
        }

        if (outgoing.Count == 0)
        {
            return new DeclareTeamsResult(0, 0, false,
                "None of the confirmed participants can receive email - they are inactive, have email notifications "
                + "switched off, or have no address on file.");
        }

        // One SMTP connection for the whole batch. See IEmailSender.SendPersonalizedAsync: a
        // connection per player is fine for a plain reminder and much too slow once every message
        // carries a megabyte of images.
        var result = await emailSender.SendPersonalizedAsync(outgoing, inlineImages);

        if (result.Sent == 0)
        {
            logger.LogError("Team declaration for MatchDay {MatchDayId} reached none of its {Count} mailable participant(s). First error: {Error}",
                matchDay.Id, outgoing.Count, result.ErrorMessage);
        }

        return new DeclareTeamsResult(result.Sent, result.Failed, false, result.ErrorMessage);
    }

    /// <summary>Renders the admin-editable TEAMS_GENERATED template and guarantees the two images
    /// are actually in the result. The guarantee matters because the template is stored in the
    /// database: an installation that saved the old, image-free template would otherwise keep
    /// sending an email whose whole point is a picture it never includes. A template that does
    /// reference the placeholders is left exactly as the admin arranged it.</summary>
    private async Task<(string Subject, string Body)> RenderDeclarationAsync(
        string playerName, string matchDayName, DateTime matchDayDate, string venueName, string teamBuildingUrl)
    {
        var (subject, body) = await emailTemplateService.RenderAsync(
            EmailTemplateKeys.TeamsGenerated,
            new Dictionary<string, string>
            {
                ["PlayerName"] = playerName,
                ["MatchDayName"] = matchDayName,
                ["MatchDayDateTime"] = matchDayDate.ToString("MMMM d, yyyy 'at' h:mm tt"),
                ["VenueName"] = venueName,
                ["TeamBuildingUrl"] = teamBuildingUrl,
                ["TeamsImage"] = $"cid:{TeamsImageContentId}",
                ["ScheduleImage"] = $"cid:{ScheduleImageContentId}",
            });

        if (!body.Contains($"cid:{TeamsImageContentId}", StringComparison.Ordinal))
        {
            // Warned about rather than done quietly. The append can only put the images after
            // everything else the template contains - including its footer - which is exactly how
            // one declaration went out reading header, greeting, footer, and only then the
            // line-ups. The images being present is the important part, but a stored template
            // this old wants resetting to default on the Email Templates page.
            logger.LogWarning(
                "TEAMS_GENERATED has no {{TeamsImage}} placeholder, so the images were appended after the template body - "
                + "they will render below the footer. Reset the template to default to place them properly.");
            body = AppendImagesToBody(body);
        }

        return (subject, body);
    }

    private static string AppendImagesToBody(string body)
    {
        const string block = """
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
            <tr><td style="padding:18px 22px 6px;font-size:12px;font-weight:bold;letter-spacing:1.4px;color:#667085;text-transform:uppercase;">Today's teams</td></tr>
            <tr><td style="padding:0 22px;"><img src="cid:bofc-teams" alt="Today's teams" style="display:block;width:100%;height:auto;border:0;border-radius:12px;"></td></tr>
            <tr><td style="padding:22px 22px 6px;font-size:12px;font-weight:bold;letter-spacing:1.4px;color:#667085;text-transform:uppercase;">Today's schedule</td></tr>
            <tr><td style="padding:0 22px 22px;"><img src="cid:bofc-schedule" alt="Today's schedule" style="display:block;width:100%;height:auto;border:0;border-radius:12px;"></td></tr>
            </table>
            """;

        var closingBody = body.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        return closingBody < 0 ? body + block : body.Insert(closingBody, block);
    }

    /// <summary>Accepts what the browser's canvas actually produces - a
    /// <c>data:image/png;base64,</c> data URL - as well as a bare base64 payload.</summary>
    private static byte[] DecodeImageOrThrow(string? value, string label)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new BadRequestException($"The {label} image is missing - try again, and check the browser console if it keeps happening.");
        }

        var payload = value;
        var comma = payload.IndexOf(',');
        if (payload.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma > 0)
        {
            payload = payload[(comma + 1)..];
        }

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(payload);
        }
        catch (FormatException)
        {
            throw new BadRequestException($"The {label} image could not be read - it was not valid base64.");
        }

        if (bytes.Length > MaxImageBytes)
        {
            throw new BadRequestException(
                $"The {label} image is {bytes.Length / (1024 * 1024)}MB, over the {MaxImageBytes / (1024 * 1024)}MB limit.");
        }

        // PNG magic number. Guards against a truncated or failed render arriving as a few bytes of
        // nothing and being mailed to the whole club as a broken image.
        if (bytes.Length < 8 || bytes[0] != 0x89 || bytes[1] != 0x50 || bytes[2] != 0x4E || bytes[3] != 0x47)
        {
            throw new BadRequestException($"The {label} image was not a valid PNG.");
        }

        return bytes;
    }

    private static string SlugifyForFileName(string name)
    {
        var cleaned = new string(name.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
        return string.Join('-', cleaned.Split('-', StringSplitOptions.RemoveEmptyEntries));
    }

    /// <summary>Test recipients, comma/semicolon/whitespace separated. More than one is allowed
    /// because a declaration is only ever sent once for real: checking how a batch behaves - how
    /// long 25 messages carrying a megabyte of images actually take - is otherwise impossible
    /// without aiming it at the whole club.</summary>
    private static List<string> SplitAddresses(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split([',', ';', ' ', '\t', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

    /// <summary>"saifulhoque30@gmail.com" -> "Saifulhoque30". Only ever used for the PlayerName
    /// greeting in a test send, where there is no player record to take a real name from.</summary>
    private static string LocalPartAsName(string email)
    {
        var localPart = email.Split('@')[0];
        return string.IsNullOrEmpty(localPart) ? "there" : char.ToUpperInvariant(localPart[0]) + localPart[1..];
    }

    /// <summary>The "Send Match Day Reminder" button on Team Building - manually triggered, reuses
    /// the exact same per-MatchDay send the hourly MatchDayReminderBackgroundService runs
    /// automatically (see its SendForMatchDayAsync), so a manual nudge behaves identically to a
    /// scheduled one: only players who haven't voted yet, active + email-notifications-on only.
    /// Also resets the MatchDay's ReminderSentAt, so the automatic scheduler won't immediately
    /// re-send on its next hourly tick.</summary>
    public async Task<int> SendMatchDayReminderNowAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.Include(m => m.Venue).FirstOrDefaultAsync(m => m.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        var activePlayers = await db.Players.Where(p => p.IsActive && p.EmailNotificationsEnabled)
            .Select(p => new MatchDayReminderBackgroundService.ReminderPlayer(p.Id, p.Name, p.Email))
            .ToListAsync();

        var sent = await MatchDayReminderBackgroundService.SendForMatchDayAsync(
            db, emailSender, emailTemplateService, voteTokenService, appUrlOptions, logger, matchDay, activePlayers, DateTime.Now);

        await db.SaveChangesAsync();
        return sent;
    }

    /// <summary>One click, N goalkeepers per team (a starter plus backup/rotation cover - see
    /// SystemSettings.MinGoalkeepersPerTeam): for every team on this MatchDay short of that count,
    /// fills the gap from that team's own roster - DefaultGoalkeeper players first (see
    /// SelectGoalkeepersForTeam), the club's fairness formula (see ComputeGoalkeeperBalancesAsync)
    /// for whatever's left. Teams already at or past the configured count are left untouched -
    /// this only ever fills gaps, it never overrides or demotes a manual pick. The organiser can
    /// still undo any pick afterward via the normal "Remove from Goalkeeper" action.</summary>
    public async Task<GoalkeeperAutoAssignResponse> AutoAssignGoalkeepersAsync(long matchDayId)
    {
        var minGoalkeepersPerTeam = await GetMinGoalkeepersPerTeamAsync();

        var teams = await db.Teams.Include(t => t.TeamPlayers).ThenInclude(tp => tp.Player)
            .Where(t => t.MatchDayId == matchDayId)
            .ToListAsync();

        var candidatePlayerIds = teams.SelectMany(t => t.TeamPlayers).Select(tp => tp.PlayerId).Distinct().ToList();
        var (balances, pastMatchDaysConsidered, pastMatchDaysMissingGkData) =
            await ComputeGoalkeeperBalancesAsync(matchDayId, candidatePlayerIds);

        var results = new List<TeamGoalkeeperAssignmentResult>();

        foreach (var team in teams)
        {
            var existingGoalkeepers = team.TeamPlayers.Where(tp => tp.PlayingPosition == FootballPosition.GOALKEEPER).ToList();
            var slotsToFill = minGoalkeepersPerTeam - existingGoalkeepers.Count;

            if (slotsToFill <= 0)
            {
                results.Add(new TeamGoalkeeperAssignmentResult
                {
                    TeamId = team.Id,
                    TeamName = team.TeamName,
                    Assigned = [],
                    SkippedReason = "Already has enough goalkeepers",
                });
                continue;
            }

            var picks = SelectGoalkeepersForTeam(team, balances, slotsToFill);

            foreach (var pick in picks)
            {
                pick.PlayingPosition = FootballPosition.GOALKEEPER;
                await TrackGoalKeeperRoundAsync(pick.PlayerId, matchDayId);
            }

            results.Add(new TeamGoalkeeperAssignmentResult
            {
                TeamId = team.Id,
                TeamName = team.TeamName,
                Assigned = picks.Select(p => new AssignedGoalkeeperPlayer
                {
                    PlayerId = p.PlayerId,
                    PlayerName = p.Player.Name,
                    IsDefaultGoalkeeper = balances[p.PlayerId].IsDefaultGoalkeeper,
                }).ToList(),
                SkippedReason = picks.Count < slotsToFill
                    ? (team.TeamPlayers.Count == 0
                        ? "No players on this team"
                        : "Not enough eligible players (all resting or excluded)")
                    : null,
            });
        }

        await db.SaveChangesAsync();

        return new GoalkeeperAutoAssignResponse
        {
            Teams = results,
            PastMatchDaysConsidered = pastMatchDaysConsidered,
            PastMatchDaysMissingGoalkeeperData = pastMatchDaysMissingGkData,
        };
    }

    /// <summary>Falls back to the entity default (2) if the settings row doesn't exist yet (fresh
    /// install, Settings page never opened) rather than throwing.</summary>
    private async Task<int> GetMinGoalkeepersPerTeamAsync() =>
        (await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1))?.MinGoalkeepersPerTeam
            ?? new SystemSettings().MinGoalkeepersPerTeam;

    private sealed record PlayerGoalkeeperBalance(int Played, int InGoal, double Balance, bool IsResting, bool IsExcluded, bool IsDefaultGoalkeeper)
    {
        public bool IsEligible => !IsResting && !IsExcluded;
    }

    /// <summary>Who fills this team's open goalkeeper slot(s), shared by AutoAssignGoalkeepersAsync
    /// (which actually assigns) and GetGoalkeeperRankingAsync (which just previews it as NEXT_UP) -
    /// one place for the pick order so the preview never lies about what the button will do.
    ///
    /// DefaultGoalkeeper players (Player.DefaultGoalkeeper - "only ever wants to play goalkeeper")
    /// get first claim on the open slots, ahead of the fairness balance math:
    ///  - enough slots for all of them -> every one gets a slot, any slots left over go to the
    ///    balance-ranked pool same as before.
    ///  - more of them than slots -> the balance pool sits this one out entirely (the slots are
    ///    already spoken for) and who among the default goalkeepers gets picked is a random draw,
    ///    not a balance ranking - they're all "always goalkeeper" players, so balance doesn't
    ///    distinguish them, and a fixed order (e.g. by playerId) would always favor the same few.
    /// Never touches a slot a human already filled - slotsToFill only ever covers what's still
    /// open (see callers).</summary>
    private static List<TeamPlayer> SelectGoalkeepersForTeam(Team team, Dictionary<long, PlayerGoalkeeperBalance> balances, int slotsToFill)
    {
        if (slotsToFill <= 0) return [];

        var eligibleNonGoalkeepers = team.TeamPlayers
            .Where(tp => tp.PlayingPosition != FootballPosition.GOALKEEPER
                && balances.TryGetValue(tp.PlayerId, out var b) && b.IsEligible)
            .ToList();

        var defaultGoalkeepers = eligibleNonGoalkeepers.Where(tp => balances[tp.PlayerId].IsDefaultGoalkeeper).ToList();

        if (defaultGoalkeepers.Count > slotsToFill)
        {
            return defaultGoalkeepers.OrderBy(_ => Random.Shared.Next()).Take(slotsToFill).ToList();
        }

        var others = eligibleNonGoalkeepers.Where(tp => !balances[tp.PlayerId].IsDefaultGoalkeeper).ToList();
        var balancedPicks = others
            .OrderByDescending(tp => balances[tp.PlayerId].Balance)
            .ThenBy(tp => tp.PlayerId)
            .Take(slotsToFill - defaultGoalkeepers.Count);

        return defaultGoalkeepers.Concat(balancedPicks).ToList();
    }

    /// <summary>Read-only view of the same ranking AutoAssignGoalkeepersAsync acts on - lets the
    /// UI show the club's "Whose turn in goal" table (played/in goal/balance/status per player,
    /// ranked, NEXT UP marked) before or instead of actually assigning anyone.</summary>
    public async Task<GoalkeeperRankingResponse> GetGoalkeeperRankingAsync(long matchDayId)
    {
        var minGoalkeepersPerTeam = await GetMinGoalkeepersPerTeamAsync();

        var teams = await db.Teams.Include(t => t.TeamPlayers).ThenInclude(tp => tp.Player)
            .Where(t => t.MatchDayId == matchDayId)
            .ToListAsync();

        var candidatePlayerIds = teams.SelectMany(t => t.TeamPlayers).Select(tp => tp.PlayerId).Distinct().ToList();
        var (balances, pastMatchDaysConsidered, pastMatchDaysMissingGkData) =
            await ComputeGoalkeeperBalancesAsync(matchDayId, candidatePlayerIds);

        var teamRankings = new List<TeamGoalkeeperRanking>();
        foreach (var team in teams)
        {
            var existingGoalkeeperCount = team.TeamPlayers.Count(tp => tp.PlayingPosition == FootballPosition.GOALKEEPER);
            var slotsToFill = minGoalkeepersPerTeam - existingGoalkeeperCount;

            var ranked = team.TeamPlayers
                .Select(tp => (TeamPlayer: tp, Balance: balances.GetValueOrDefault(tp.PlayerId)))
                .Where(x => x.Balance != null)
                .OrderByDescending(x => x.Balance!.Balance)
                .ThenBy(x => x.TeamPlayer.PlayerId)
                .ToList();

            // Same selection AutoAssignGoalkeepersAsync would actually make (default-goalkeepers
            // first, balance-ranked fill after) - see SelectGoalkeepersForTeam. In the "more
            // default goalkeepers than slots" case this preview's random draw won't necessarily
            // match the real click's draw, same as the real button re-drawing every time it runs.
            var nextUpPlayerIds = SelectGoalkeepersForTeam(team, balances, slotsToFill)
                .Select(tp => tp.PlayerId)
                .ToHashSet();

            var rows = ranked.Select((x, i) => new GoalkeeperRankingPlayer
            {
                Rank = i + 1,
                PlayerId = x.TeamPlayer.PlayerId,
                PlayerName = x.TeamPlayer.Player.Name,
                Played = x.Balance!.Played,
                InGoal = x.Balance.InGoal,
                Balance = Math.Round(x.Balance.Balance, 2),
                IsDefaultGoalkeeper = x.Balance.IsDefaultGoalkeeper,
                Status = x.TeamPlayer.PlayingPosition == FootballPosition.GOALKEEPER ? "CURRENT_GOALKEEPER"
                    : x.Balance.IsExcluded ? "NOT_IN_ROTATION"
                    : x.Balance.IsResting ? "RESTING"
                    : nextUpPlayerIds.Contains(x.TeamPlayer.PlayerId) ? "NEXT_UP"
                    : "ELIGIBLE",
            }).ToList();

            teamRankings.Add(new TeamGoalkeeperRanking
            {
                TeamId = team.Id,
                TeamName = team.TeamName,
                Players = rows,
            });
        }

        return new GoalkeeperRankingResponse
        {
            Teams = teamRankings,
            PastMatchDaysConsidered = pastMatchDaysConsidered,
            PastMatchDaysMissingGoalkeeperData = pastMatchDaysMissingGkData,
        };
    }

    /// <summary>Implements the club's "Whose turn in goal" fairness formula: every past MatchDay a
    /// player attended hands them a slice of that day's actual keeper count divided by that day's
    /// attendance (a thin turnout owes more per player than a big one - see the reference doc's
    /// "big turnouts ask less" guardrail), summed across every MatchDay they played in. Actually
    /// keeping goal pays a whole turn off. Balance = slices owed - turns served; the player owed
    /// the most should go in goal next. A player who kept goal in either of the two most recent
    /// past MatchDays is resting regardless of balance (nobody plays two weeks running); an
    /// admin-excluded player is never eligible regardless of balance either - both are reported as
    /// ineligible rather than silently dropped, so callers can show why someone was skipped.</summary>
    private async Task<(Dictionary<long, PlayerGoalkeeperBalance> Balances, int PastMatchDaysConsidered, int PastMatchDaysMissingGkData)>
        ComputeGoalkeeperBalancesAsync(long matchDayId, IReadOnlyCollection<long> candidatePlayerIds)
    {
        var matchDay = await GetMatchDayOrThrowAsync(matchDayId);

        var pastMatchDays = await db.MatchDays
            .Where(t => t.MatchDayDate < matchDay.MatchDayDate)
            .OrderByDescending(t => t.MatchDayDate)
            .Select(t => new { t.Id, t.MatchDayDate })
            .ToListAsync();
        var pastMatchDayIds = pastMatchDays.Select(t => t.Id).ToHashSet();

        // "Held back automatically" - kept goal in either of the two most recent past MatchDays.
        var lastTwoMatchDayIds = pastMatchDays.Take(2).Select(t => t.Id).ToHashSet();

        var attendance = await db.MatchDayParticipants
            .Where(p => p.ParticipationStatus && pastMatchDayIds.Contains(p.MatchDayId))
            .Select(p => new { p.MatchDayId, p.PlayerId })
            .ToListAsync();

        var goalkeeperRows = await db.PlayerGoalkeepingHistories
            .Where(h => pastMatchDayIds.Contains(h.MatchDayId))
            .Select(h => new { h.MatchDayId, h.PlayerId })
            .Distinct()
            .ToListAsync();

        var attendanceCountByMatchDay = attendance.GroupBy(a => a.MatchDayId).ToDictionary(g => g.Key, g => g.Count());
        var goalkeeperCountByMatchDay = goalkeeperRows.GroupBy(g => g.MatchDayId).ToDictionary(g => g.Key, g => g.Count());
        var attendanceByPlayer = attendance.GroupBy(a => a.PlayerId).ToDictionary(g => g.Key, g => g.Select(a => a.MatchDayId).ToList());
        var goalkeeperMatchDaysByPlayer = goalkeeperRows.GroupBy(g => g.PlayerId).ToDictionary(g => g.Key, g => g.Select(x => x.MatchDayId).ToHashSet());

        var excludedPlayerIds = await db.Players
            .Where(p => candidatePlayerIds.Contains(p.Id) && p.ExcludeFromGoalkeeperRotation)
            .Select(p => p.Id)
            .ToListAsync();
        var excludedSet = excludedPlayerIds.ToHashSet();

        // Players who only ever want to play goalkeeper - see Player.DefaultGoalkeeper. Mutually
        // exclusive with ExcludeFromGoalkeeperRotation (enforced in PlayerService), so no overlap
        // with excludedSet above.
        var defaultGoalkeeperPlayerIds = await db.Players
            .Where(p => candidatePlayerIds.Contains(p.Id) && p.DefaultGoalkeeper)
            .Select(p => p.Id)
            .ToListAsync();
        var defaultGoalkeeperSet = defaultGoalkeeperPlayerIds.ToHashSet();

        var balances = new Dictionary<long, PlayerGoalkeeperBalance>();
        foreach (var playerId in candidatePlayerIds)
        {
            var owed = 0.0;
            var played = 0;
            if (attendanceByPlayer.TryGetValue(playerId, out var attendedMatchDayIds))
            {
                played = attendedMatchDayIds.Count;
                foreach (var attendedId in attendedMatchDayIds)
                {
                    var denom = attendanceCountByMatchDay.GetValueOrDefault(attendedId, 0);
                    if (denom <= 0) continue;
                    var numer = goalkeeperCountByMatchDay.GetValueOrDefault(attendedId, 0);
                    owed += (double)numer / denom;
                }
            }

            var served = goalkeeperMatchDaysByPlayer.TryGetValue(playerId, out var gkDays) ? gkDays.Count : 0;
            var isResting = gkDays != null && lastTwoMatchDayIds.Overlaps(gkDays);
            var isExcluded = excludedSet.Contains(playerId);
            var isDefaultGoalkeeper = defaultGoalkeeperSet.Contains(playerId);

            balances[playerId] = new PlayerGoalkeeperBalance(played, served, owed - served, isResting, isExcluded, isDefaultGoalkeeper);
        }

        var pastMatchDaysMissingGkData = pastMatchDays.Count(t =>
            attendanceCountByMatchDay.GetValueOrDefault(t.Id, 0) > 0
            && goalkeeperCountByMatchDay.GetValueOrDefault(t.Id, 0) == 0);

        return (balances, pastMatchDays.Count, pastMatchDaysMissingGkData);
    }

    public async Task<List<MatchDayWithTeamsResponse>> GetMatchDaysSummaryAsync(long? matchDayId)
    {
        if (matchDayId != null)
        {
            return [await GetMatchDayWithTeamsAndPlayersAsync(matchDayId.Value)];
        }

        var matchDays = await db.MatchDays.Include(t => t.Venue).ToListAsync();
        var result = new List<MatchDayWithTeamsResponse>();
        foreach (var matchDay in matchDays)
        {
            result.Add(await BuildMatchDayWithTeamsResponseAsync(matchDay));
        }

        return result;
    }

    private async Task<MatchDayWithTeamsResponse> GetMatchDayWithTeamsAndPlayersAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.Include(t => t.Venue).FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        return await BuildMatchDayWithTeamsResponseAsync(matchDay);
    }

    private async Task<MatchDayWithTeamsResponse> BuildMatchDayWithTeamsResponseAsync(MatchDay matchDay)
    {
        var teams = await db.Teams
            .Include(t => t.TeamPlayers).ThenInclude(tp => tp.Player)
            .Where(t => t.MatchDayId == matchDay.Id)
            .ToListAsync();

        return new MatchDayWithTeamsResponse
        {
            Id = matchDay.Id,
            Name = matchDay.Name,
            Title = matchDay.Title,
            Season = matchDay.Season,
            Description = matchDay.Description,
            Rules = matchDay.Rules,
            MatchDayDate = matchDay.MatchDayDate,
            DurationMinutes = matchDay.DurationMinutes,
            VenueName = matchDay.Venue.Name,
            VenueMapLink = matchDay.Venue.MapLink,
            ActiveStatus = matchDay.IsActive,
            IsWeeklyMatchDay = matchDay.IsWeeklyMatchDay,
            Teams = teams.Select(ConvertToMatchDayTeamResponse).ToList(),
        };
    }

    private MatchDayTeamResponse ConvertToMatchDayTeamResponse(Team team) => new()
    {
        TeamId = team.Id,
        TeamName = team.TeamName,
        LogoKey = team.LogoKey,
        LogoUrl = BuildTeamLogoUrl(team.LogoKey),
        Players = team.TeamPlayers.Select(tp => new TeamPlayerResponse
        {
            Id = tp.Id,
            TeamId = team.Id,
            PlayerId = tp.Player.Id,
            TeamName = team.TeamName,
            PlayerName = tp.Player.Name,
            PlayingPosition = tp.PlayingPosition,
            TeamPlayerRole = tp.TeamPlayerRole.ToString(),
            IsCaptain = tp.IsCaptain,
            JerseyNumber = tp.JerseyNumber,
            PhotoKey = tp.Player.PhotoKey,
            PhotoUrl = BuildPlayerPhotoUrl(tp.Player.PhotoKey),
        }).ToList(),
    };

    private async Task<bool> IsPlayerAssignedToAnyTeamInMatchDayAsync(long matchDayId, long playerId)
    {
        var teamIds = await db.Teams.Where(t => t.MatchDayId == matchDayId).Select(t => t.Id).ToListAsync();
        return await db.TeamPlayers.AnyAsync(tp => teamIds.Contains(tp.TeamId) && tp.PlayerId == playerId);
    }

    private async Task<MatchDay> GetMatchDayOrThrowAsync(long matchDayId) =>
        await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

    private async Task<Team> GetTeamOrThrowAsync(long teamId) =>
        await db.Teams.FirstOrDefaultAsync(t => t.Id == teamId)
            ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

    private async Task<Player> GetPlayerOrThrowAsync(long playerId) =>
        await db.Players.FirstOrDefaultAsync(p => p.Id == playerId)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

    private async Task ValidateMatchDayDateAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        if (matchDay.MatchDayDate < DateTime.Now)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayDateCannotBePastDate, HttpStatusCode.BadRequest);
        }
    }

    private async Task<TeamPlayer> CreateTeamPlayerAsync(TeamPlayerRequest request, Team team, Player player)
    {
        await ValidateMatchDayDateAsync(team.MatchDayId);

        var isParticipant = await db.MatchDayParticipants.AnyAsync(
            tp => tp.MatchDayId == team.MatchDayId && tp.PlayerId == player.Id && tp.ParticipationStatus);
        if (!isParticipant)
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotParticipantYet, HttpStatusCode.BadRequest);
        }

        if (await IsPlayerAssignedToAnyTeamInMatchDayAsync(team.MatchDayId, player.Id))
        {
            throw new TeamServiceException(RestErrorMessageDetail.PlayerAlreadyAddedAnotherTeam, HttpStatusCode.Conflict);
        }

        if (request.IsCaptain == true)
        {
            await RemoveCaptainStatusFromOtherPlayersAsync(request.TeamId!.Value, player.Id);
        }

        var isCaptain = request.IsCaptain ?? false;
        var position = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        var teamPlayer = new TeamPlayer
        {
            TeamId = team.Id,
            Team = team,
            PlayerId = player.Id,
            Player = player,
            PlayingPosition = position,
            IsCaptain = isCaptain,
            TeamPlayerRole = isCaptain ? Domain.Enums.TeamPlayerRole.CAPTAIN : Domain.Enums.TeamPlayerRole.PLAYER,
            JerseyNumber = request.JerseyNumber,
        };

        if (position == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }

        return teamPlayer;
    }

    private async Task<TeamPlayer> UpdateTeamPlayerAsync(TeamPlayerRequest request, Team team, Player player)
    {
        await ValidateMatchDayDateAsync(team.MatchDayId);

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.Id == request.Id)
            ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

        var previousPosition = teamPlayer.PlayingPosition;
        var newPosition = FootballPositionExtensions.GetPositionOrDefault(request.PlayingPosition);

        if (previousPosition == FootballPosition.GOALKEEPER && newPosition != FootballPosition.GOALKEEPER)
        {
            await RemoveGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }
        else if (previousPosition != FootballPosition.GOALKEEPER && newPosition == FootballPosition.GOALKEEPER)
        {
            await TrackGoalKeeperRoundAsync(player.Id, team.MatchDayId);
        }

        if (request.IsCaptain == true)
        {
            await RemoveCaptainStatusFromOtherPlayersAsync(request.TeamId!.Value, player.Id);
        }

        teamPlayer.TeamId = team.Id;
        teamPlayer.Team = team;
        teamPlayer.PlayerId = player.Id;
        teamPlayer.Player = player;
        teamPlayer.PlayingPosition = newPosition;

        var newIsCaptain = request.IsCaptain ?? teamPlayer.IsCaptain;
        teamPlayer.IsCaptain = newIsCaptain;
        teamPlayer.TeamPlayerRole = newIsCaptain ? Domain.Enums.TeamPlayerRole.CAPTAIN : Domain.Enums.TeamPlayerRole.PLAYER;
        teamPlayer.JerseyNumber = request.JerseyNumber ?? teamPlayer.JerseyNumber;

        return teamPlayer;
    }

    private TeamResponse ConvertToTeamResponse(Team team, string matchDayName) => new()
    {
        TeamId = team.Id,
        TeamName = team.TeamName,
        LogoKey = team.LogoKey,
        LogoUrl = BuildTeamLogoUrl(team.LogoKey),
        MatchDayId = team.MatchDayId,
        MatchDayName = matchDayName,
    };

    private static string? BuildTeamLogoUrl(string? logoKey) =>
        string.IsNullOrWhiteSpace(logoKey) ? null : $"/files/team-logos/{logoKey}";

    private TeamPlayerResponse ConvertToTeamPlayerResponse(TeamPlayer teamPlayer, Team team, Player player) => new()
    {
        Id = teamPlayer.Id,
        TeamId = team.Id,
        TeamName = team.TeamName,
        PlayerId = player.Id,
        PlayerName = player.Name,
        PlayingPosition = teamPlayer.PlayingPosition,
        TeamPlayerRole = teamPlayer.TeamPlayerRole.ToString(),
        IsCaptain = teamPlayer.IsCaptain,
        JerseyNumber = teamPlayer.JerseyNumber,
        PhotoKey = player.PhotoKey,
        PhotoUrl = BuildPlayerPhotoUrl(player.PhotoKey),
    };

    private static string? BuildPlayerPhotoUrl(string? photoKey) =>
        string.IsNullOrWhiteSpace(photoKey) ? null : $"/files/player-photos/{photoKey}";

    private async Task TrackGoalKeeperRoundAsync(long playerId, long matchDayId)
    {
        var lastRoundInPreviousMatchDays = await db.PlayerGoalkeepingHistories
            .Where(h => h.PlayerId == playerId)
            .Select(h => (int?)h.RoundNumber)
            .MaxAsync() ?? 0;

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        db.PlayerGoalkeepingHistories.Add(new PlayerGoalkeepingHistory
        {
            PlayerId = playerId,
            MatchDayId = matchDayId,
            RoundNumber = lastRoundInPreviousMatchDays + 1,
            PlayedDate = matchDay.MatchDayDate,
        });
    }

    private async Task RemoveGoalKeeperRoundAsync(long playerId, long matchDayId)
    {
        var histories = await db.PlayerGoalkeepingHistories
            .Where(h => h.PlayerId == playerId && h.MatchDayId == matchDayId)
            .ToListAsync();
        db.PlayerGoalkeepingHistories.RemoveRange(histories);
    }

    private async Task RemoveCaptainStatusFromOtherPlayersAsync(long teamId, long currentPlayerId)
    {
        var teamPlayers = await db.TeamPlayers
            .Where(tp => tp.TeamId == teamId && tp.PlayerId != currentPlayerId && tp.IsCaptain)
            .ToListAsync();

        foreach (var tp in teamPlayers)
        {
            tp.IsCaptain = false;
        }
    }
}
