namespace BofcBackend.Api.Domain.Constants;

/// <summary>
/// Port of enums/PlayerRole.java. Roles are stored as free-text rows in the `roles`
/// table (Role.Name), not a DB enum, so these are well-known constants for
/// [Authorize(Roles = "...")] attributes and role comparisons - same role as the
/// Java enum's .name() usage (e.g. PlayerRole.ADMIN.name()).
/// </summary>
public static class PlayerRoleNames
{
    public const string SuperAdmin = "SUPERADMIN";
    public const string Admin = "ADMIN";
    public const string Player = "PLAYER";
    public const string Coach = "COACH";
    public const string Manager = "MANAGER";
    public const string Spectator = "SPECTATOR";
    public const string Coordinator = "COORDINATOR";
    public const string TeamOwner = "TEAM_OWNER";
    public const string OutsidePlayer = "OUTSIDE_PLAYER";

    public const string AdminOrSuperAdmin = Admin + "," + SuperAdmin;
}
