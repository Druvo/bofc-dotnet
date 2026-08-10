namespace BofcBackend.Api.Common.Security;

/// <summary>Port of security/util/SecurityUtil.java's getLoggedInUser()/getLoggedInPlayer() surface.</summary>
public interface ICurrentUserService
{
    /// <summary>Email (JWT subject) of the authenticated caller. Throws BofcSecurityException if unauthenticated.</summary>
    string GetEmail();

    /// <summary>Player id from the "userId" token claim, or null if unauthenticated - used for audit fallback (SYSTEM_USER_ID).</summary>
    long? TryGetPlayerId();

    /// <summary>Player id (SecurityUtil.getLoggedInUserId()). Throws BofcSecurityException if unauthenticated.</summary>
    long GetPlayerId();

    /// <summary>Mirrors checks like `authorities.anyMatch(a -&gt; "ROLE_SUPERADMIN".equals(a))` - role name without the "ROLE_" prefix.</summary>
    bool IsInRole(string role);

    /// <summary>SecurityUtil.isUserAuthorizedForSelf(id) - true if the authenticated caller's own id matches id. Throws BofcSecurityException if unauthenticated (matches Java: this calls getLoggedInUserId(), which throws).</summary>
    bool IsUserAuthorizedForSelf(long id);
}
