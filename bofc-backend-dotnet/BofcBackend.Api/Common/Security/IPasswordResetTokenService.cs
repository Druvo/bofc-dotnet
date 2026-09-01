namespace BofcBackend.Api.Common.Security;

/// <summary>Issues and validates the tamper-proof, time-limited tokens embedded in "forgot
/// password" reset links. A token is the only credential the reset endpoint trusts - anyone can
/// call it anonymously, so the token itself must fully authenticate the (player, current password)
/// pair without a logged-in session. Binding to a fingerprint of the CURRENT password hash (not
/// just the playerId) makes every token single-use for free: once the password actually changes
/// (via this token or any other means), the fingerprint no longer matches and the token is dead -
/// no separate "used tokens" table to maintain.</summary>
public interface IPasswordResetTokenService
{
    string CreateToken(long playerId, string currentPasswordHash, TimeSpan lifetime);

    /// <summary>Returns null on any invalid, tampered, or expired token - never throws, since the
    /// input is untrusted and attacker-controlled. Caller must additionally verify the returned
    /// PasswordFingerprint still matches the player's current password hash.</summary>
    (long PlayerId, string PasswordFingerprint)? TryDecodeToken(string token);
}
