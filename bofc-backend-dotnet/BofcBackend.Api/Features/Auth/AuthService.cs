using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auth.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Auth;

/// <summary>Port of service/AuthServiceImpl.java.</summary>
public class AuthService(BofcDbContext db, IJwtTokenService jwtTokenService, ICurrentUserService currentUser)
    : IAuthService
{
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
}
