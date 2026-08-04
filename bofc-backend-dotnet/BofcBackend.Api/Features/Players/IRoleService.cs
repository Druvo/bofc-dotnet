using BofcBackend.Api.Features.Players.Models;

namespace BofcBackend.Api.Features.Players;

/// <summary>Port of service/RoleService.java.</summary>
public interface IRoleService
{
    Task<RoleResponse> CreateRoleAsync(RoleRequest request);
    Task<List<RoleResponse>> GetAllRolesAsync();
    Task<RoleResponse> GetRoleByIdAsync(long id);
    Task DeleteRoleAsync(long id);
    Task<List<PlayerWithRolesResponse>> BatchAssignRolesToPlayersAsync(PlayerRoleAssignmentRequest request);
    Task<List<PlayerWithRolesResponse>> GetAllPlayersWithRolesAsync();
    Task<PlayerWithRolesResponse> GetPlayerWithRolesAsync(long playerId);
}
