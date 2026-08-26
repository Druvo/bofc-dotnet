namespace BofcBackend.Api.Common.Security;

/// <summary>Issues and validates the tamper-proof, time-limited tokens embedded in match-day
/// reminder email vote links. A token is the only credential the vote endpoint trusts - anyone
/// can call that endpoint anonymously, so the token itself must fully authenticate the (player,
/// matchDay) pair without a logged-in session.</summary>
public interface IMatchDayVoteTokenService
{
    string CreateToken(long playerId, long matchDayId, TimeSpan lifetime);

    /// <summary>Returns null on any invalid, tampered, or expired token - never throws, since the
    /// input is untrusted and attacker-controlled.</summary>
    (long PlayerId, long MatchDayId)? TryDecodeToken(string token);
}
