using BofcBackend.Api.Features.Auth.Models;

namespace BofcBackend.Api.Features.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task ChangePasswordAsync(ChangePasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);

    /// <summary>Mandatory first-login/expired-password reset - no OldPassword check (see ForcePasswordResetRequest doc comment).</summary>
    Task ForcePasswordResetAsync(ForcePasswordResetRequest request);

    /// <summary>"Forgot password?" on the login page - anonymous, no logged-in session. Always
    /// completes successfully regardless of whether the email matches a player, so the caller
    /// can't use response timing/shape to enumerate registered emails.</summary>
    Task RequestPasswordResetAsync(string email);

    /// <summary>Redeems a "forgot password" email link. Throws if the token is missing, expired,
    /// tampered, or already used (password changed since the token was minted).</summary>
    Task ResetPasswordWithTokenAsync(string token, string newPassword);
}
