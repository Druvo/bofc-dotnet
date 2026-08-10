namespace BofcBackend.Api.Common.Security;

public interface IJwtTokenService
{
    /// <summary>
    /// Mirrors util/JWTUtil.java#generateToken - subject is the player's email, roles go in a
    /// "roles" claim. playerId is a .NET-side addition (a "userId" claim) so audit fields
    /// (created_by/last_modified_by) don't need a DB round trip to resolve - harmless, since
    /// the frontend only ever reads the `exp` claim from decoded tokens (see auctionWebSocket
    /// contract research), never the rest of the payload shape.
    /// </summary>
    string GenerateToken(string email, long playerId, IEnumerable<string> roles);
}
