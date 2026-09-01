using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.DataProtection;

namespace BofcBackend.Api.Common.Security;

/// <summary>Uses ASP.NET Core's Data Protection API (same primitive as MatchDayVoteTokenService,
/// distinct Purpose string) for AES-encrypted + authenticated (tamper-evident) + time-limited
/// tokens.</summary>
public class PasswordResetTokenService(IDataProtectionProvider dataProtectionProvider) : IPasswordResetTokenService
{
    private const string Purpose = "BofcBackend.PasswordReset.v1";

    private readonly ITimeLimitedDataProtector protector = dataProtectionProvider
        .CreateProtector(Purpose)
        .ToTimeLimitedDataProtector();

    public string CreateToken(long playerId, string currentPasswordHash, TimeSpan lifetime) =>
        protector.Protect($"{playerId}:{Fingerprint(currentPasswordHash)}", lifetime);

    public (long PlayerId, string PasswordFingerprint)? TryDecodeToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        try
        {
            var payload = protector.Unprotect(token);
            var parts = payload.Split(':', 2);
            if (parts.Length != 2) return null;
            if (!long.TryParse(parts[0], out var playerId)) return null;
            return (playerId, parts[1]);
        }
        catch
        {
            // Untrusted, attacker-controlled input - any failure (bad format, tampered
            // payload, expired token, wrong key ring) must degrade to "invalid", never throw.
            return null;
        }
    }

    /// <summary>Short, non-reversible stand-in for the full bcrypt hash - never need the real hash
    /// back out, just a stable value that changes whenever the password does.</summary>
    public static string Fingerprint(string passwordHash) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(passwordHash)))[..16];
}
