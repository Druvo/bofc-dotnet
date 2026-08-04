using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;

namespace BofcBackend.Api.Common.Security;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public string GetEmail()
    {
        var email = httpContextAccessor.HttpContext?.User?.Identity?.Name;
        if (string.IsNullOrEmpty(email))
        {
            // Mirrors SecurityUtil.getAuthentication() throwing when there's no authenticated principal.
            throw new BofcSecurityException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);
        }
        return email;
    }

    public long? TryGetPlayerId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;
        return long.TryParse(claim, out var id) ? id : null;
    }

    public long GetPlayerId() =>
        TryGetPlayerId() ?? throw new BofcSecurityException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

    public bool IsInRole(string role) => httpContextAccessor.HttpContext?.User?.IsInRole(role) ?? false;

    public bool IsUserAuthorizedForSelf(long id) => id == GetPlayerId();
}
