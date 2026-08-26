using System.Net;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.MatchDayVote;

/// <summary>Public, unauthenticated one-click Yes/No RSVP endpoint reachable from a match-day
/// reminder email. Security relies entirely on the opaque, signed, time-limited token (see
/// MatchDayVoteTokenService) rather than a login session - anyone with the link can vote AS the
/// player it was issued to, which is the intended behavior (that player is the one reading their
/// own inbox), but nothing else: the token can't be edited, replayed past its expiry, or reused
/// to vote for a different player/matchDay than it was minted for.
///
/// Deliberately does NOT reuse MatchDayParticipantService.SaveOrUpdateMatchDayParticipantAsync -
/// that method assumes an authenticated ICurrentUserService context (self/admin/coordinator role
/// checks) which doesn't exist here by design.</summary>
[ApiController]
[Route("vote")]
[AllowAnonymous]
public class MatchDayVoteController(BofcDbContext db, IMatchDayVoteTokenService tokenService) : ControllerBase
{
    [HttpGet]
    public async Task<ContentResult> Vote([FromQuery] string token, [FromQuery] string choice)
    {
        var decoded = tokenService.TryDecodeToken(token);
        if (decoded == null)
        {
            return Page("Link expired", "This voting link is invalid or has expired. Please check your most recent match-day email for a fresh link, or open the app to RSVP.", false);
        }

        var normalizedChoice = choice?.Trim().ToLowerInvariant();
        if (normalizedChoice != "yes" && normalizedChoice != "no")
        {
            return Page("Invalid request", "This voting link is malformed.", false);
        }
        var participationStatus = normalizedChoice == "yes";

        var (playerId, matchDayId) = decoded.Value;

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(m => m.Id == matchDayId);
        if (matchDay == null)
        {
            return Page("Match day not found", "This match day no longer exists.", false);
        }
        if (matchDay.MatchDayDate < DateTime.Now)
        {
            return Page("Too late", $"\"{Encode(matchDay.Name)}\" has already started or finished, so RSVPs are closed.", false);
        }
        if (matchDay.MatchDayStatus == MatchDayStatus.CONCLUDED)
        {
            return Page("Match day concluded", $"\"{Encode(matchDay.Name)}\" has already concluded, so RSVPs are closed.", false);
        }

        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == playerId && p.IsActive);
        if (player == null)
        {
            return Page("Player not found", "This player account is no longer active.", false);
        }

        var participant = await db.MatchDayParticipants.FirstOrDefaultAsync(p => p.MatchDayId == matchDayId && p.PlayerId == playerId);
        if (participant == null)
        {
            participant = new MatchDayParticipant { MatchDayId = matchDayId, PlayerId = playerId };
            db.MatchDayParticipants.Add(participant);
        }
        participant.ParticipationStatus = participationStatus;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Concurrent vote (e.g. clicking Yes then No in quick succession) racing the unique
            // index - harmless, the loser's click just didn't land; ask them to retry.
            return Page("Please try again", "Your vote could not be recorded just now - please click the link again.", false);
        }

        var headline = participationStatus ? "You're in!" : "You're out";
        var body = participationStatus
            ? $"Thanks, {Encode(player.Name)} - you're marked as playing \"{Encode(matchDay.Name)}\"."
            : $"Got it, {Encode(player.Name)} - you're marked as not playing \"{Encode(matchDay.Name)}\".";

        return Page(headline, body, true);
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);

    private ContentResult Page(string headline, string message, bool success)
    {
        var color = success ? "#16a34a" : "#dc2626";
        var html = $$"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>{{Encode(headline)}}</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;min-height:100vh;">
                <tr>
                  <td align="center" style="padding:48px 16px;">
                    <table role="presentation" width="420" cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding:32px 24px;text-align:center;">
                          <div style="font-size:20px;font-weight:600;color:{{color}};margin-bottom:12px;">{{Encode(headline)}}</div>
                          <div style="font-size:14px;line-height:1.6;color:#374151;">{{message}}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

        return new ContentResult { Content = html, ContentType = "text/html", StatusCode = 200 };
    }
}
