namespace BofcBackend.Api.Common.Security;

/// <summary>
/// Bound from the "Vapid" config section - the keypair Web Push uses to sign
/// push messages. Dev keys live in appsettings.Development.json; production
/// must supply these via user-secrets/env vars (Vapid__PrivateKey etc.), same
/// rule as Jwt:Secret - never commit a real private key.
/// </summary>
public class VapidOptions
{
    public string Subject { get; set; } = "mailto:admin@bofc.local";
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
}
