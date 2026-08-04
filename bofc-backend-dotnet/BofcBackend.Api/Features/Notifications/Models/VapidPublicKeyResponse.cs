namespace BofcBackend.Api.Features.Notifications.Models;

public class VapidPublicKeyResponse(string publicKey)
{
    public string PublicKey { get; } = publicKey;
}
