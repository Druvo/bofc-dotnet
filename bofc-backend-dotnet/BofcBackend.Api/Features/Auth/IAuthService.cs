using BofcBackend.Api.Features.Auth.Models;

namespace BofcBackend.Api.Features.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task ChangePasswordAsync(ChangePasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);

    /// <summary>Mandatory first-login/expired-password reset - no OldPassword check (see ForcePasswordResetRequest doc comment).</summary>
    Task ForcePasswordResetAsync(ForcePasswordResetRequest request);
}
