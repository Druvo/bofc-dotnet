using Microsoft.AspNetCore.DataProtection;

namespace BofcBackend.Api.Common.Security;

/// <summary>Uses ASP.NET Core's Data Protection API (already registered for SMTP-password
/// encryption-at-rest) as the crypto primitive: AES-encrypted + authenticated (tamper-evident) +
/// time-limited, keyed off a purpose string distinct from every other protector in the app so a
/// vote token can never be replayed as a different kind of token or vice versa.</summary>
public class MatchDayVoteTokenService(IDataProtectionProvider dataProtectionProvider) : IMatchDayVoteTokenService
{
    private const string Purpose = "BofcBackend.MatchDayVote.v1";

    private readonly ITimeLimitedDataProtector protector = dataProtectionProvider
        .CreateProtector(Purpose)
        .ToTimeLimitedDataProtector();

    public string CreateToken(long playerId, long matchDayId, TimeSpan lifetime) =>
        protector.Protect($"{playerId}:{matchDayId}", lifetime);

    public (long PlayerId, long MatchDayId)? TryDecodeToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        try
        {
            var payload = protector.Unprotect(token);
            var parts = payload.Split(':', 2);
            if (parts.Length != 2) return null;
            if (!long.TryParse(parts[0], out var playerId)) return null;
            if (!long.TryParse(parts[1], out var matchDayId)) return null;
            return (playerId, matchDayId);
        }
        catch
        {
            // Untrusted, attacker-controlled input - any failure (bad format, tampered
            // payload, expired token, wrong key ring) must degrade to "invalid", never throw.
            return null;
        }
    }
}
