namespace BofcBackend.Api.Common.Security;

/// <summary>Bound from the "Jwt" config section - mirrors jwt.secret / jwt.expiration in application.yml.</summary>
public class JwtOptions
{
    public string Secret { get; set; } = string.Empty;

    /// <summary>Token lifetime in milliseconds (Java stores it the same way: jwt.expiration).</summary>
    public long ExpirationMs { get; set; }
}
