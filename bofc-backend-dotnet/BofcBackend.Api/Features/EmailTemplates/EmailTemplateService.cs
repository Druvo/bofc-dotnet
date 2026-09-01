using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.EmailTemplates.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.EmailTemplates;

/// <summary>Port-free, new feature (no Java equivalent) - admin-editable content for the app's
/// system-generated emails. See Domain/Constants/EmailTemplateKeys.cs for the fixed set of keys;
/// Defaults below is the single source of truth for both a template's starting content and what
/// "reset to default" restores.</summary>
public class EmailTemplateService(
    BofcDbContext db,
    IEmailSender emailSender,
    IMatchDayVoteTokenService voteTokenService,
    IOptions<AppUrlOptions> appUrlOptions,
    ICurrentUserService currentUser) : IEmailTemplateService
{
    private sealed record TemplateDefault(string Name, string Description, string Subject, string Body, string[] Placeholders);

    private static readonly Dictionary<string, TemplateDefault> Defaults = new()
    {
        [EmailTemplateKeys.PaymentDueReminder] = new TemplateDefault(
            "Payment Due Reminder",
            "Sent to every active player with no club-dues payment recorded for the current month, starting on the configured day - repeats every few days until they pay or the month rolls over.",
            "BOFC Payment Due Reminder - {{MonthYear}}",
            """
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>BOFC — Club Dues Reminder</title>
            <style>
              html, body { margin:0!important; padding:0!important; width:100%!important; background:#eef1f0; }
              body { font-family:Arial,Helvetica,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
              table { border-collapse:collapse; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
              td { padding:0; }
              img { border:0; display:block; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
              a { text-decoration:none; }
              .wrap { width:100%; max-width:640px; margin:0 auto; }
              .mobile-pad { padding-left:42px!important; padding-right:42px!important; }
              .stack { display:table-cell; }
              @media screen and (max-width:600px) {
                .outer { padding:12px!important; }
                .wrap { width:100%!important; }
                .mobile-pad { padding-left:22px!important; padding-right:22px!important; }
                .stack { display:block!important; width:100%!important; box-sizing:border-box; }
                .hero-title { font-size:38px!important; line-height:42px!important; }
                .event-card { margin-bottom:10px!important; }
                .cta { display:block!important; width:auto!important; }
                .logo { width:118px!important; }
              }
            </style>
            </head>
            <body>
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Friendly reminder: {{MonthYear}} club dues are still pending, {{PlayerName}}.</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f0" style="font-family:Arial,Helvetica,sans-serif;">
            <tr><td align="center" class="outer" style="padding:28px 14px;">
            <table role="presentation" class="wrap" width="640" cellpadding="0" cellspacing="0" border="0">

            <!-- BOFC HEADER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:18px 18px 0 0;padding:24px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td align="left" valign="middle">
            <img class="logo" src="{{BofcLogoUrl}}" width="125" height="125" alt="BOFC - Originals Football Club" style="display:block;border:0;outline:none;width:125px;height:125px;">
            </td>
            <td align="right" valign="middle" style="font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1.4px;color:#7bd43d;text-transform:uppercase;">
            PAYMENT REMINDER
            </td>
            </tr>
            </table>
            </td></tr>

            <!-- HERO -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;padding:20px 30px 42px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:13px;line-height:20px;font-weight:bold;letter-spacing:2px;color:#7bd43d;text-transform:uppercase;">
            ★ BOFC NOTICE ★
            </div>
            <div class="hero-title" style="font-size:48px;line-height:52px;font-weight:900;letter-spacing:-1px;color:#ffffff;margin-top:10px;">
            YOUR DUES ARE
            <span style="color:#7bd43d;"> HIDING!</span>
            </div>
            <div style="font-size:16px;line-height:25px;color:#ffffff;margin-top:10px;">
            We checked the records... they didn't show up yet. 👀
            </div>
            </td></tr>
            </table>
            </td></tr>

            <!-- CONTENT CARD -->
            <tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:18px;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td class="mobile-pad" style="padding:38px 42px 12px;">
            <div style="font-size:18px;line-height:27px;font-weight:700;color:#17263a;">
            Hey {{PlayerName}},
            </div>
            <div style="font-size:16px;line-height:25px;color:#17263a;margin-top:14px;">
            Your club dues for <strong>{{MonthYear}}</strong> haven't been recorded yet.
            </div>
            </td></tr>

            <tr><td class="mobile-pad" style="padding:18px 42px 8px;">
            <div style="font-size:20px;line-height:28px;font-weight:900;color:#17263a;text-align:center;">
            <span style="color:#7bd43d;">—</span> WHERE DOES YOUR CLUB FEE GO? <span style="color:#7bd43d;">—</span>
            </div>
            </td></tr>

            <!-- EXPENSE CARDS -->
            <tr><td class="mobile-pad" style="padding:12px 34px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td class="stack" width="25%" valign="top" style="padding:7px;">
            <table role="presentation" width="100%" bgcolor="#f5f8f3" style="background:#f5f8f3;border-radius:12px;">
            <tr><td align="center" style="padding:20px 8px;">
            <div style="font-size:27px;line-height:1;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;">🏟️</div>
            <div style="font-size:12px;line-height:18px;font-weight:900;color:#2f7d22;margin-top:8px;">FIELD FEES</div>
            <div style="font-size:12px;line-height:18px;color:#4f5d50;margin-top:5px;">Keeping the pitch booked and ready.</div>
            </td></tr>
            </table>
            </td>
            <td class="stack" width="25%" valign="top" style="padding:7px;">
            <table role="presentation" width="100%" bgcolor="#f5f8f3" style="background:#f5f8f3;border-radius:12px;">
            <tr><td align="center" style="padding:20px 8px;">
            <div style="font-size:27px;line-height:1;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;">💧</div>
            <div style="font-size:12px;line-height:18px;font-weight:900;color:#2f7d22;margin-top:8px;">WATER</div>
            <div style="font-size:12px;line-height:18px;color:#4f5d50;margin-top:5px;">Because 90 minutes without water is a bad plan.</div>
            </td></tr>
            </table>
            </td>
            <td class="stack" width="25%" valign="top" style="padding:7px;">
            <table role="presentation" width="100%" bgcolor="#f5f8f3" style="background:#f5f8f3;border-radius:12px;">
            <tr><td align="center" style="padding:20px 8px;">
            <div style="font-size:27px;line-height:1;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;">🥤</div>
            <div style="font-size:12px;line-height:18px;font-weight:900;color:#2f7d22;margin-top:8px;">SNACKS</div>
            <div style="font-size:12px;line-height:18px;color:#4f5d50;margin-top:5px;">Because goals don't keep us alive. 😅</div>
            </td></tr>
            </table>
            </td>
            <td class="stack" width="25%" valign="top" style="padding:7px;">
            <table role="presentation" width="100%" bgcolor="#f5f8f3" style="background:#f5f8f3;border-radius:12px;">
            <tr><td align="center" style="padding:20px 8px;">
            <div style="font-size:27px;line-height:1;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;">⚽</div>
            <div style="font-size:12px;line-height:18px;font-weight:900;color:#2f7d22;margin-top:8px;">EQUIPMENT</div>
            <div style="font-size:12px;line-height:18px;color:#4f5d50;margin-top:5px;">Balls, gloves and gear when needed.</div>
            </td></tr>
            </table>
            </td>
            </tr>
            </table>
            </td></tr>

            <tr><td class="mobile-pad" style="padding:22px 42px 10px;">
            <div style="border:1px dashed #c8d0c8;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:16px;line-height:23px;font-weight:900;color:#17263a;">🟥 NO RED CARD... YET.</div>
            <div style="font-size:14px;line-height:21px;color:#667085;margin-top:4px;">
            Please help us keep the club running and settle your dues when you can.
            </div>
            </div>
            </td></tr>

            <tr><td align="center" style="padding:10px 42px 34px;">
            <a href="{{PaymentUrl}}" target="_blank" class="cta" style="display:inline-block;background:#2f9e1f;color:#ffffff;font-size:16px;line-height:21px;font-weight:900;border-radius:9px;padding:15px 28px;">
            PAY YOUR CLUB DUES →
            </a>
            <div style="font-size:14px;line-height:22px;color:#667085;margin-top:15px;">
            Every contribution helps keep the pitch booked,<br>
            the water flowing, and the snacks appearing after the match.
            </div>
            <div style="font-size:15px;line-height:22px;font-weight:bold;color:#17263a;margin-top:13px;">
            Thanks for being part of BOFC! ⚽
            </div>
            </td></tr>
            </table>
            </td></tr>

            <!-- FOOTER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:0 0 18px 18px;padding:30px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:14px;line-height:20px;color:#7bd43d;font-weight:bold;">
            Pride. Passion. Football.
            </div>
            <div style="font-size:11px;line-height:17px;color:#8795a4;margin-top:10px;">
            © 2026 BOFC. All rights reserved.
            </div>
            </td></tr>
            </table>
            </td></tr>

            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """,
            ["PlayerName", "MonthYear", "PaymentUrl"]),

        [EmailTemplateKeys.MatchDayReminder] = new TemplateDefault(
            "Upcoming Match Day Reminder",
            "Sent to every active player who hasn't voted Yes/No yet, starting the configured number of days before kickoff - repeats every few hours until they vote or the Match Day starts.",
            "BOFC Upcoming {{MatchDayName}} Reminder",
            """
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>BOFC — Upcoming MatchDay Reminder</title>
            <style>
              html, body { margin:0!important; padding:0!important; width:100%!important; background:#eef1f0; }
              body { font-family:Arial,Helvetica,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
              table { border-collapse:collapse; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
              td { padding:0; }
              img { border:0; display:block; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
              a { text-decoration:none; }
              .wrap { width:100%; max-width:640px; margin:0 auto; }
              .mobile-pad { padding-left:42px!important; padding-right:42px!important; }
              .stack { display:table-cell; }
              @media screen and (max-width:600px) {
                .outer { padding:12px!important; }
                .wrap { width:100%!important; }
                .mobile-pad { padding-left:22px!important; padding-right:22px!important; }
                .stack { display:block!important; width:100%!important; box-sizing:border-box; }
                .hero-title { font-size:38px!important; line-height:42px!important; }
                .event-card { margin-bottom:10px!important; }
                .cta { display:block!important; width:auto!important; }
                .logo { width:118px!important; }
              }
            </style>
            </head>
            <body>
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">{{MatchDayName}} is coming up! Let us know if you're in, {{PlayerName}}.</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f0" style="font-family:Arial,Helvetica,sans-serif;">
            <tr><td align="center" class="outer" style="padding:28px 14px;">
            <table role="presentation" class="wrap" width="640" cellpadding="0" cellspacing="0" border="0">

            <!-- BOFC HEADER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:18px 18px 0 0;padding:24px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td align="left" valign="middle">
            <img class="logo" src="{{BofcLogoUrl}}" width="125" height="125" alt="BOFC - Originals Football Club" style="display:block;border:0;outline:none;width:125px;height:125px;">
            </td>
            <td align="right" valign="middle" style="font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1.4px;color:#7bd43d;text-transform:uppercase;">
            MATCHDAY REMINDER
            </td>
            </tr>
            </table>
            </td></tr>

            <!-- HERO -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;padding:20px 30px 42px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:13px;line-height:20px;font-weight:bold;letter-spacing:2px;color:#7bd43d;text-transform:uppercase;">
            ★ BOFC REMINDER ★
            </div>
            <div class="hero-title" style="font-size:48px;line-height:52px;font-weight:900;letter-spacing:-1px;color:#ffffff;margin-top:10px;">
            KICKOFF IS
            <span style="color:#7bd43d;"> COMING!</span>
            </div>
            <div style="font-size:16px;line-height:25px;color:#ffffff;margin-top:10px;">
            The pitch is ready. Your teammates are ready. Are you? 😉
            </div>
            </td></tr>
            </table>
            </td></tr>

            <!-- CONTENT CARD -->
            <tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:18px;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td class="mobile-pad" style="padding:38px 42px 12px;">
            <div style="font-size:18px;line-height:27px;font-weight:700;color:#17263a;">
            Hey {{PlayerName}},
            </div>
            <div style="font-size:21px;line-height:29px;font-weight:900;color:#2f7d22;margin-top:13px;">
            {{MatchDayName}} is almost here!
            </div>
            </td></tr>

            <tr><td class="mobile-pad" style="padding:16px 34px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td class="stack" width="50%" valign="top" style="padding:7px;">
            <table role="presentation" width="100%" bgcolor="#f5f8f3" style="background:#f5f8f3;border-radius:12px;">
            <tr><td align="center" style="padding:22px 10px;">
            <img src="{{IconBaseUrl}}/calendar.png" width="28" height="28" alt="" style="display:block;margin:0 auto;border:0;outline:none;width:28px;height:28px;">
            <div style="font-size:12px;line-height:18px;font-weight:900;color:#2f7d22;letter-spacing:.8px;margin-top:8px;">DATE &amp; TIME</div>
            <div style="font-size:14px;line-height:21px;font-weight:bold;color:#17263a;margin-top:6px;">{{MatchDayDateTime}}</div>
            </td></tr>
            </table>
            </td>
            <td class="stack" width="50%" valign="top" style="padding:7px;">
            <table role="presentation" width="100%" bgcolor="#f5f8f3" style="background:#f5f8f3;border-radius:12px;">
            <tr><td align="center" style="padding:22px 10px;">
            <img src="{{IconBaseUrl}}/pin.png" width="28" height="28" alt="" style="display:block;margin:0 auto;border:0;outline:none;width:28px;height:28px;">
            <div style="font-size:12px;line-height:18px;font-weight:900;color:#2f7d22;letter-spacing:.8px;margin-top:8px;">VENUE</div>
            <div style="font-size:14px;line-height:21px;font-weight:bold;color:#17263a;margin-top:6px;">{{VenueName}}</div>
            </td></tr>
            </table>
            </td>
            </tr>
            </table>
            </td></tr>

            <tr><td class="mobile-pad" style="padding:20px 42px 8px;">
            <div style="border-top:1px dashed #c8d0c8;text-align:center;height:1px;">
            <img src="{{IconBaseUrl}}/football.png" width="22" height="22" alt="" style="display:inline-block;position:relative;top:-11px;background:#fff;padding:0 12px;border:0;outline:none;width:22px;height:22px;">
            </div>
            </td></tr>

            <tr><td align="center" class="mobile-pad" style="padding:8px 42px 12px;">
            <div style="font-size:18px;line-height:26px;font-weight:700;color:#17263a;">
            Are you in?
            </div>
            <div style="font-size:14px;line-height:22px;color:#667085;margin-top:5px;">
            Let us know so we can plan the teams.
            </div>
            </td></tr>

            <!-- DYNAMIC VOTE BUTTONS -->
            <tr><td class="mobile-pad" style="padding:8px 30px 36px;">
            {{VoteButtons}}
            </td></tr>

            </table>
            </td></tr>

            <!-- FOOTER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:0 0 18px 18px;padding:30px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:14px;line-height:20px;color:#7bd43d;font-weight:bold;">
            Pride. Passion. Football.
            </div>
            <div style="font-size:11px;line-height:17px;color:#8795a4;margin-top:10px;">
            © 2026 BOFC. All rights reserved.
            </div>
            </td></tr>
            </table>
            </td></tr>

            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """,
            ["PlayerName", "MatchDayName", "MatchDayDateTime", "VenueName", "VoteButtons"]),

        [EmailTemplateKeys.TeamsGenerated] = new TemplateDefault(
            "Teams Announced",
            "Sent to every confirmed player once teams and fixtures are auto-generated for a MatchDay - links straight to the live Team Building page.",
            "BOFC Teams Are In - {{MatchDayName}}",
            """
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>BOFC — Teams Announced</title>
            <style>
              html, body { margin:0!important; padding:0!important; width:100%!important; background:#eef1f0; }
              body { font-family:Arial,Helvetica,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
              table { border-collapse:collapse; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
              td { padding:0; }
              img { border:0; display:block; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
              a { text-decoration:none; }
              .wrap { width:100%; max-width:640px; margin:0 auto; }
              .mobile-pad { padding-left:42px!important; padding-right:42px!important; }
              @media screen and (max-width:600px) {
                .outer { padding:12px!important; }
                .wrap { width:100%!important; }
                .mobile-pad { padding-left:22px!important; padding-right:22px!important; }
                .hero-title { font-size:38px!important; line-height:42px!important; }
                .cta { display:block!important; width:auto!important; }
                .logo { width:118px!important; }
              }
            </style>
            </head>
            <body>
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Teams are set for {{MatchDayName}} - see who you're playing with, {{PlayerName}}.</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f0" style="font-family:Arial,Helvetica,sans-serif;">
            <tr><td align="center" class="outer" style="padding:28px 14px;">
            <table role="presentation" class="wrap" width="640" cellpadding="0" cellspacing="0" border="0">

            <!-- BOFC HEADER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:18px 18px 0 0;padding:24px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td align="left" valign="middle">
            <img class="logo" src="{{BofcLogoUrl}}" width="125" height="125" alt="BOFC - Originals Football Club" style="display:block;border:0;outline:none;width:125px;height:125px;">
            </td>
            <td align="right" valign="middle" style="font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1.4px;color:#7bd43d;text-transform:uppercase;">
            TEAMS ANNOUNCED
            </td>
            </tr>
            </table>
            </td></tr>

            <!-- HERO -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;padding:20px 30px 42px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:13px;line-height:20px;font-weight:bold;letter-spacing:2px;color:#7bd43d;text-transform:uppercase;">
            ★ BOFC TEAM NEWS ★
            </div>
            <div class="hero-title" style="font-size:48px;line-height:52px;font-weight:900;letter-spacing:-1px;color:#ffffff;margin-top:10px;">
            THE TEAMS ARE
            <span style="color:#7bd43d;"> IN!</span>
            </div>
            <div style="font-size:16px;line-height:25px;color:#ffffff;margin-top:10px;">
            No trades, no complaints - the draft has spoken. 😄
            </div>
            </td></tr>
            </table>
            </td></tr>

            <!-- CONTENT CARD -->
            <tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:18px;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td class="mobile-pad" style="padding:38px 42px 12px;">
            <div style="font-size:18px;line-height:27px;font-weight:700;color:#17263a;">
            Hey {{PlayerName}},
            </div>
            <div style="font-size:16px;line-height:25px;color:#17263a;margin-top:14px;">
            Teams and fixtures for <strong>{{MatchDayName}}</strong> are ready.
            </div>
            <div style="font-size:14px;line-height:22px;color:#667085;margin-top:5px;font-family:Arial,Helvetica,'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;">
            📅 {{MatchDayDateTime}}<br>
            📍 {{VenueName}}
            </div>
            </td></tr>

            <tr><td align="center" style="padding:20px 42px 34px;">
            <a href="{{TeamBuildingUrl}}" target="_blank" class="cta" style="display:inline-block;background:#2f9e1f;color:#ffffff;font-size:16px;line-height:21px;font-weight:900;border-radius:9px;padding:15px 28px;">
            VIEW TEAM →
            </a>
            <div style="font-size:14px;line-height:22px;color:#667085;margin-top:15px;">
            See your team, your teammates, and who you're up against.
            </div>
            </td></tr>
            </table>
            </td></tr>

            <!-- FOOTER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:0 0 18px 18px;padding:30px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:14px;line-height:20px;color:#7bd43d;font-weight:bold;">
            Pride. Passion. Football.
            </div>
            <div style="font-size:11px;line-height:17px;color:#8795a4;margin-top:10px;">
            © 2026 BOFC. All rights reserved.
            </div>
            </td></tr>
            </table>
            </td></tr>

            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """,
            ["PlayerName", "MatchDayName", "MatchDayDateTime", "VenueName", "TeamBuildingUrl"]),

        [EmailTemplateKeys.PasswordReset] = new TemplateDefault(
            "Password Reset",
            "Sent when a player uses \"Forgot password?\" on the login page - the link is single-use and expires after 1 hour.",
            "BOFC Password Reset Request",
            """
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>BOFC — Password Reset</title>
            <style>
              html, body { margin:0!important; padding:0!important; width:100%!important; background:#eef1f0; }
              body { font-family:Arial,Helvetica,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
              table { border-collapse:collapse; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
              td { padding:0; }
              img { border:0; display:block; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
              a { text-decoration:none; }
              .wrap { width:100%; max-width:640px; margin:0 auto; }
              .mobile-pad { padding-left:42px!important; padding-right:42px!important; }
              @media screen and (max-width:600px) {
                .outer { padding:12px!important; }
                .wrap { width:100%!important; }
                .mobile-pad { padding-left:22px!important; padding-right:22px!important; }
                .hero-title { font-size:32px!important; line-height:36px!important; }
                .cta { display:block!important; width:auto!important; }
                .logo { width:118px!important; }
              }
            </style>
            </head>
            <body>
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Reset your BOFC password, {{PlayerName}} - this link expires in 1 hour.</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f0" style="font-family:Arial,Helvetica,sans-serif;">
            <tr><td align="center" class="outer" style="padding:28px 14px;">
            <table role="presentation" class="wrap" width="640" cellpadding="0" cellspacing="0" border="0">

            <!-- BOFC HEADER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:18px 18px 0 0;padding:24px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td align="left" valign="middle">
            <img class="logo" src="{{BofcLogoUrl}}" width="125" height="125" alt="BOFC - Originals Football Club" style="display:block;border:0;outline:none;width:125px;height:125px;">
            </td>
            <td align="right" valign="middle" style="font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1.4px;color:#7bd43d;text-transform:uppercase;">
            PASSWORD RESET
            </td>
            </tr>
            </table>
            </td></tr>

            <!-- HERO -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;padding:20px 30px 42px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:13px;line-height:20px;font-weight:bold;letter-spacing:2px;color:#7bd43d;text-transform:uppercase;">
            ★ BOFC ACCOUNT SECURITY ★
            </div>
            <div class="hero-title" style="font-size:40px;line-height:44px;font-weight:900;letter-spacing:-1px;color:#ffffff;margin-top:10px;">
            RESET YOUR
            <span style="color:#7bd43d;"> PASSWORD</span>
            </div>
            <div style="font-size:16px;line-height:25px;color:#ffffff;margin-top:10px;">
            We got a request to reset your password.
            </div>
            </td></tr>
            </table>
            </td></tr>

            <!-- CONTENT CARD -->
            <tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:18px;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td class="mobile-pad" style="padding:38px 42px 12px;">
            <div style="font-size:18px;line-height:27px;font-weight:700;color:#17263a;">
            Hey {{PlayerName}},
            </div>
            <div style="font-size:16px;line-height:25px;color:#17263a;margin-top:14px;">
            Click the button below to choose a new password. This link expires in <strong>1 hour</strong> and can only be used once.
            </div>
            </td></tr>

            <tr><td align="center" style="padding:20px 42px 12px;">
            <a href="{{ResetUrl}}" target="_blank" class="cta" style="display:inline-block;background:#2f9e1f;color:#ffffff;font-size:16px;line-height:21px;font-weight:900;border-radius:9px;padding:15px 28px;">
            RESET PASSWORD →
            </a>
            </td></tr>

            <tr><td class="mobile-pad" style="padding:10px 42px 34px;">
            <div style="font-size:13px;line-height:20px;color:#8792A8;">
            If you didn't request this, you can safely ignore this email - your password won't change unless you click the button above.
            </div>
            </td></tr>
            </table>
            </td></tr>

            <!-- FOOTER -->
            <tr><td bgcolor="#071a2d" style="background:#071a2d;border-radius:0 0 18px 18px;padding:30px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <div style="font-size:14px;line-height:20px;color:#7bd43d;font-weight:bold;">
            Pride. Passion. Football.
            </div>
            <div style="font-size:11px;line-height:17px;color:#8795a4;margin-top:10px;">
            © 2026 BOFC. All rights reserved.
            </div>
            </td></tr>
            </table>
            </td></tr>

            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """,
            ["PlayerName", "ResetUrl"]),
    };

    public async Task<List<EmailTemplateResponse>> GetAllAsync()
    {
        await EnsureAllDefaultsExistAsync();
        // Filter to keys still in Defaults - a row for a retired key (removed from
        // EmailTemplateKeys/Defaults) stays in the table but must stop showing up here.
        var templates = await db.EmailTemplates.OrderBy(t => t.Name).ToListAsync();
        return templates.Where(t => Defaults.ContainsKey(t.Key)).Select(ToResponse).ToList();
    }

    public async Task<EmailTemplateResponse> UpdateAsync(long id, UpdateEmailTemplateRequest request)
    {
        var template = await GetByIdOrThrowAsync(id);
        template.Subject = request.Subject.Trim();
        template.Body = request.Body;
        await db.SaveChangesAsync();
        return ToResponse(template);
    }

    public async Task<EmailTemplateResponse> ResetToDefaultAsync(long id)
    {
        var template = await GetByIdOrThrowAsync(id);
        var fallback = Defaults.GetValueOrDefault(template.Key);
        if (fallback != null)
        {
            template.Subject = fallback.Subject;
            template.Body = fallback.Body;
            await db.SaveChangesAsync();
        }
        return ToResponse(template);
    }

    public async Task<(string Subject, string Body)> RenderAsync(string key, Dictionary<string, string> placeholders)
    {
        var template = await db.EmailTemplates.FirstOrDefaultAsync(t => t.Key == key)
            ?? await CreateFromDefaultAsync(key);

        var merged = WithSharedPlaceholders(placeholders);
        return (Render(template.Subject, merged), Render(template.Body, merged));
    }

    public async Task<EmailTemplatePreviewResponse> PreviewAsync(long id)
    {
        var template = await GetByIdOrThrowAsync(id);
        var placeholders = WithSharedPlaceholders(await BuildSampleDataAsync(template.Key, matchDayId: null));
        var subject = Render(template.Subject, placeholders);
        var body = Render(template.Body, placeholders);
        var html = await emailSender.RenderPreviewAsync(subject, body);
        return new EmailTemplatePreviewResponse { Subject = subject, Html = html };
    }

    public async Task SendTestAsync(long id, string toEmail, long? matchDayId)
    {
        var template = await GetByIdOrThrowAsync(id);
        var placeholders = WithSharedPlaceholders(await BuildSampleDataAsync(template.Key, matchDayId));
        var subject = $"[TEST] {Render(template.Subject, placeholders)}";
        var body = Render(template.Body, placeholders);

        var result = await emailSender.SendAsync([toEmail], subject, body);
        if (result.Sent == 0)
        {
            throw new BadRequestException("Failed to send the test email - check SMTP is enabled and configured in Settings, then try again.");
        }
    }

    /// <summary>Sample placeholder values for the preview pane / test-send, keyed by template.
    /// For MatchDayReminder with a real <paramref name="matchDayId"/>, uses that MatchDay's actual
    /// data and mints genuine (short-lived) vote tokens so a test send is a real end-to-end check
    /// of the voting flow, not just the visual design.</summary>
    private async Task<Dictionary<string, string>> BuildSampleDataAsync(string key, long? matchDayId)
    {
        // Use the admin's own name when there's a logged-in player context (makes a test send
        // read naturally as "hey, you"), otherwise a generic placeholder name for the preview pane.
        var testPlayerId0 = currentUser.TryGetPlayerId();
        var sampleName = testPlayerId0 != null
            ? await db.Players.Where(p => p.Id == testPlayerId0).Select(p => p.Name).FirstOrDefaultAsync() ?? "Alex"
            : "Alex";

        if (key == EmailTemplateKeys.MatchDayReminder)
        {
            if (matchDayId != null)
            {
                var matchDay = await db.MatchDays.Include(m => m.Venue).FirstOrDefaultAsync(m => m.Id == matchDayId)
                    ?? throw new BadRequestException("The selected match day was not found.");

                var baseUrl = appUrlOptions.Value.BaseUrl.TrimEnd('/');
                var lifetime = TimeSpan.FromHours(2);
                // Mint the token for the admin's OWN playerId so a test send is genuinely
                // clickable end-to-end (votes as the admin, not a fake/unusable id) - falls back
                // to 0 (a guaranteed-nonexistent player) if there's no logged-in player context,
                // which still exercises the token/render path without corrupting real RSVP data.
                var testPlayerId = testPlayerId0 ?? 0L;
                var token = voteTokenService.CreateToken(testPlayerId, matchDay.Id, lifetime);
                var encodedToken = Uri.EscapeDataString(token);
                var voteButtons = $"""
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                    <td class="stack" width="50%" style="padding:6px;">
                    <a href="{baseUrl}/vote?token={encodedToken}&choice=yes" style="display:block;text-align:center;background:#2f9e1f;color:#ffffff;font-size:15px;line-height:20px;font-weight:900;border-radius:9px;padding:14px 10px;font-family:Arial,Helvetica,sans-serif;"><img src="{baseUrl}/email/icons/check.png" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;outline:none;width:16px;height:16px;">YES, I'M IN</a>
                    </td>
                    <td class="stack" width="50%" style="padding:6px;">
                    <a href="{baseUrl}/vote?token={encodedToken}&choice=no" style="display:block;text-align:center;background:#e6e9ea;color:#17263a;font-size:15px;line-height:20px;font-weight:900;border-radius:9px;padding:14px 10px;font-family:Arial,Helvetica,sans-serif;"><img src="{baseUrl}/email/icons/cross.png" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;outline:none;width:16px;height:16px;">CAN'T MAKE IT</a>
                    </td>
                    </tr>
                    </table>
                    """;

                return new Dictionary<string, string>
                {
                    ["PlayerName"] = sampleName,
                    ["MatchDayName"] = matchDay.Name,
                    ["MatchDayDateTime"] = matchDay.MatchDayDate.ToString("MMMM d, yyyy 'at' h:mm tt"),
                    ["VenueName"] = matchDay.Venue.Name,
                    ["VoteButtons"] = voteButtons,
                };
            }

            var sampleBaseUrl = appUrlOptions.Value.BaseUrl.TrimEnd('/');
            var sampleVoteButtons = $"""
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                <td class="stack" width="50%" style="padding:6px;">
                <a href="#" onclick="return false;" style="display:block;text-align:center;background:#2f9e1f;color:#ffffff;font-size:15px;line-height:20px;font-weight:900;border-radius:9px;padding:14px 10px;font-family:Arial,Helvetica,sans-serif;opacity:0.6;"><img src="{sampleBaseUrl}/email/icons/check.png" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;outline:none;width:16px;height:16px;">YES, I'M IN</a>
                </td>
                <td class="stack" width="50%" style="padding:6px;">
                <a href="#" onclick="return false;" style="display:block;text-align:center;background:#e6e9ea;color:#17263a;font-size:15px;line-height:20px;font-weight:900;border-radius:9px;padding:14px 10px;font-family:Arial,Helvetica,sans-serif;opacity:0.6;"><img src="{sampleBaseUrl}/email/icons/cross.png" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;outline:none;width:16px;height:16px;">CAN'T MAKE IT</a>
                </td>
                </tr>
                </table>
                """;
            return new Dictionary<string, string>
            {
                ["PlayerName"] = sampleName,
                ["MatchDayName"] = "Saturday Football",
                ["MatchDayDateTime"] = DateTime.Now.AddDays(3).ToString("MMMM d, yyyy 'at' h:mm tt"),
                ["VenueName"] = "Sample Venue",
                ["VoteButtons"] = sampleVoteButtons,
            };
        }

        if (key == EmailTemplateKeys.PaymentDueReminder)
        {
            // PaymentUrl comes from WithSharedPlaceholders, not set here.
            return new Dictionary<string, string>
            {
                ["PlayerName"] = sampleName,
                ["MonthYear"] = DateTime.Now.ToString("MMMM yyyy"),
            };
        }

        if (key == EmailTemplateKeys.TeamsGenerated)
        {
            var websiteBaseUrl = appUrlOptions.Value.WebsiteUrl.TrimEnd('/');

            if (matchDayId != null)
            {
                var matchDay = await db.MatchDays.Include(m => m.Venue).FirstOrDefaultAsync(m => m.Id == matchDayId)
                    ?? throw new BadRequestException("The selected match day was not found.");

                return new Dictionary<string, string>
                {
                    ["PlayerName"] = sampleName,
                    ["MatchDayName"] = matchDay.Name,
                    ["MatchDayDateTime"] = matchDay.MatchDayDate.ToString("MMMM d, yyyy 'at' h:mm tt"),
                    ["VenueName"] = matchDay.Venue.Name,
                    ["TeamBuildingUrl"] = $"{websiteBaseUrl}/match-days/join-match-day/{matchDay.Id}",
                };
            }

            return new Dictionary<string, string>
            {
                ["PlayerName"] = sampleName,
                ["MatchDayName"] = "Saturday Football",
                ["MatchDayDateTime"] = DateTime.Now.AddDays(3).ToString("MMMM d, yyyy 'at' h:mm tt"),
                ["VenueName"] = "Sample Venue",
                ["TeamBuildingUrl"] = $"{websiteBaseUrl}/match-days/join-match-day/0",
            };
        }

        if (key == EmailTemplateKeys.PasswordReset)
        {
            var websiteBaseUrl = appUrlOptions.Value.WebsiteUrl.TrimEnd('/');
            return new Dictionary<string, string>
            {
                ["PlayerName"] = sampleName,
                ["ResetUrl"] = $"{websiteBaseUrl}/reset-password-confirm?token=sample-token",
            };
        }

        return [];
    }

    /// <summary>Placeholders every template can use regardless of call site (the logo image URL) -
    /// merged in here rather than requiring every background service/test-send call to remember
    /// to pass it. Caller-supplied values win on key collision (there shouldn't be any).</summary>
    private Dictionary<string, string> WithSharedPlaceholders(Dictionary<string, string> placeholders)
    {
        var merged = new Dictionary<string, string>
        {
            ["BofcLogoUrl"] = $"{appUrlOptions.Value.BaseUrl.TrimEnd('/')}/email/bofc-logo.png",
            // Baked-PNG icon set (see wwwroot/email/icons) - used instead of raw unicode emoji
            // for anything structural (date/venue cards, the vote buttons, the football divider).
            // Emoji glyphs render wildly inconsistently across mail clients (Outlook/Windows Mail
            // in particular render a different size/style than a browser preview does, breaking
            // the pixel-tuned layout around them) - a real image renders identically everywhere.
            ["IconBaseUrl"] = $"{appUrlOptions.Value.BaseUrl.TrimEnd('/')}/email/icons",
            // Deep-links straight into the dashboard's Payment Accounts modal (see
            // AccountBalanceCard.tsx's ?openPayments=1 handling) - only meaningful on the
            // PaymentDueReminder template, harmless as an unused token on any other.
            ["PaymentUrl"] = $"{appUrlOptions.Value.WebsiteUrl.TrimEnd('/')}/?openPayments=1",
        };
        foreach (var (key, value) in placeholders) merged[key] = value;
        return merged;
    }

    private static string Render(string text, Dictionary<string, string> placeholders)
    {
        foreach (var (name, value) in placeholders)
        {
            text = text.Replace($"{{{{{name}}}}}", value);
        }
        return text;
    }

    private async Task EnsureAllDefaultsExistAsync()
    {
        var existingKeys = await db.EmailTemplates.Select(t => t.Key).ToListAsync();
        foreach (var key in Defaults.Keys)
        {
            if (!existingKeys.Contains(key))
            {
                await CreateFromDefaultAsync(key);
            }
        }
    }

    private async Task<EmailTemplate> CreateFromDefaultAsync(string key)
    {
        // A second concurrent request could both miss the same not-yet-created row and both try
        // to insert it - the unique index on Key makes the loser's insert fail, so it just
        // re-reads what the winner created instead of surfacing a spurious 500.
        var fallback = Defaults.GetValueOrDefault(key)
            ?? throw new BadRequestException($"Unknown email template key '{key}'", HttpStatusCode.InternalServerError);

        var template = new EmailTemplate
        {
            Key = key,
            Name = fallback.Name,
            Description = fallback.Description,
            Subject = fallback.Subject,
            Body = fallback.Body,
        };
        db.EmailTemplates.Add(template);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            db.Entry(template).State = EntityState.Detached;
            template = await db.EmailTemplates.FirstAsync(t => t.Key == key);
        }

        return template;
    }

    private async Task<EmailTemplate> GetByIdOrThrowAsync(long id) =>
        await db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == id)
        ?? throw new BadRequestException(RestErrorMessageDetail.ResourceNotFound, HttpStatusCode.NotFound);

    private static EmailTemplateResponse ToResponse(EmailTemplate template) => new()
    {
        Id = template.Id,
        Key = template.Key,
        Name = template.Name,
        Description = template.Description,
        Subject = template.Subject,
        Body = template.Body,
        AvailablePlaceholders = Defaults.GetValueOrDefault(template.Key)?.Placeholders.ToList() ?? [],
    };
}
