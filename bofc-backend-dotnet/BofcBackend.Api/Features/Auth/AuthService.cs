using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auth.Models;
using BofcBackend.Api.Features.EmailTemplates;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Auth;

/// <summary>Port of service/AuthServiceImpl.java.</summary>
public class AuthService(
    BofcDbContext db,
    IJwtTokenService jwtTokenService,
    ICurrentUserService currentUser,
    IPasswordResetTokenService passwordResetTokenService,
    IEmailSender emailSender,
    IEmailTemplateService emailTemplateService,
    IOptions<AppUrlOptions> appUrlOptions,
    ILogger<AuthService> logger)
    : IAuthService
{
    private static readonly TimeSpan PasswordResetLinkLifetime = TimeSpan.FromHours(1);

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var player = await db.Players.Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Email == request.Email && p.IsActive)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.IncorrectEmail, HttpStatusCode.Unauthorized);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, player.Password))
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PasswordMismatch, HttpStatusCode.Unauthorized);
        }

        var roleNames = player.Roles.Select(r => r.Name).ToList();
        var token = jwtTokenService.GenerateToken(player.Email, player.Id, roleNames);

        return new LoginResponse
        {
            Token = token,
            UserId = player.Id,
            Username = player.Name,
            Email = player.Email,
            Roles = roleNames,
            ResetPassword = IsResetPasswordNeeded(player),
        };
    }

    private static bool IsResetPasswordNeeded(Domain.Entities.Player player)
    {
        if (player.LastPasswordChangeDate is null)
        {
            return true;
        }
        return DateTime.UtcNow > player.LastPasswordChangeDate.Value.AddDays(AuthConstants.PasswordExpiryDays);
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request)
    {
        var email = currentUser.GetEmail();
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == email)
            ?? throw new BofcSecurityException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, player.Password))
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PasswordMismatch, HttpStatusCode.Unauthorized);
        }

        if (BCrypt.Net.BCrypt.Verify(request.NewPassword, player.Password))
        {
            throw new PlayerServiceException(RestErrorMessageDetail.NewPasswordSameAsOld, HttpStatusCode.BadRequest);
        }

        player.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        player.LastPasswordChangeDate = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task ForcePasswordResetAsync(ForcePasswordResetRequest request)
    {
        var email = currentUser.GetEmail();
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == email)
            ?? throw new BofcSecurityException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

        if (!IsResetPasswordNeeded(player))
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PasswordResetNotRequired, HttpStatusCode.BadRequest);
        }

        if (BCrypt.Net.BCrypt.Verify(request.NewPassword, player.Password))
        {
            throw new PlayerServiceException(RestErrorMessageDetail.NewPasswordSameAsOld, HttpStatusCode.BadRequest);
        }

        player.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        player.LastPasswordChangeDate = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == request.Email)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.IncorrectEmail, HttpStatusCode.NotFound);

        var currentEmail = currentUser.GetEmail();
        var currentPlayer = await db.Players.AsNoTracking().FirstOrDefaultAsync(p => p.Email == currentEmail);
        var selfReset = currentPlayer != null && currentPlayer.Id == player.Id;

        player.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        player.LastPasswordChangeDate = selfReset ? DateTime.UtcNow : null;
        await db.SaveChangesAsync();
    }

    public async Task RequestPasswordResetAsync(string email)
    {
        // Deliberately the same outcome (success, no exception) whether or not this email
        // matches an active player - an error/timing difference here would let an attacker
        // enumerate registered emails via the login page's "forgot password" form.
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == email && p.IsActive);
        if (player == null) return;

        var token = passwordResetTokenService.CreateToken(player.Id, player.Password, PasswordResetLinkLifetime);
        var resetUrl = $"{appUrlOptions.Value.WebsiteUrl.TrimEnd('/')}/reset-password-confirm?token={Uri.EscapeDataString(token)}";

        var (subject, body) = await emailTemplateService.RenderAsync(
            EmailTemplateKeys.PasswordReset,
            new Dictionary<string, string>
            {
                ["PlayerName"] = player.Name,
                ["ResetUrl"] = resetUrl,
            });

        try
        {
            await emailSender.SendAsync([player.Email], subject, body);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed emailing password reset link to player {PlayerId}", player.Id);
        }
    }

    public async Task ResetPasswordWithTokenAsync(string token, string newPassword)
    {
        var decoded = passwordResetTokenService.TryDecodeToken(token)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PasswordResetTokenInvalid, HttpStatusCode.BadRequest);

        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == decoded.PlayerId && p.IsActive)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PasswordResetTokenInvalid, HttpStatusCode.BadRequest);

        // Fingerprint of the password AT TOKEN-MINT TIME must still match the CURRENT password -
        // a mismatch means the password already changed (this token was already redeemed, or
        // changed some other way since), so the token is dead. This is the whole single-use
        // mechanism - no separate "used tokens" table needed.
        if (decoded.PasswordFingerprint != PasswordResetTokenService.Fingerprint(player.Password))
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PasswordResetTokenInvalid, HttpStatusCode.BadRequest);
        }

        player.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
        player.LastPasswordChangeDate = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }
}
