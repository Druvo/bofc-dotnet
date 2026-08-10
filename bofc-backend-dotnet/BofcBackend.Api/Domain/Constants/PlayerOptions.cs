namespace BofcBackend.Api.Domain.Constants;

/// <summary>Bound from the "Player" config section - port of config/PlayerProperties.java.</summary>
public class PlayerOptions
{
    public string DefaultPassword { get; set; } = string.Empty;
    public string? SuperAdminEmail { get; set; }
}
