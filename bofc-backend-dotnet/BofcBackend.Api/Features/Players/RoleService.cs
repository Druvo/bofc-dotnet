using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Players.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Players;

/// <summary>Port of service/RoleServiceImpl.java.</summary>
public class RoleService(BofcDbContext db, IOptions<PlayerOptions> playerOptions) : IRoleService
{
    public async Task<RoleResponse> CreateRoleAsync(RoleRequest request)
    {
        if (await db.Roles.AnyAsync(r => r.Name == request.Name))
        {
            throw new PlayerServiceException($"Role with name '{request.Name}' already exists", HttpStatusCode.Conflict);
        }

        var role = new Role { Name = request.Name! };
        db.Roles.Add(role);
        await db.SaveChangesAsync();
        return ConvertToDto(role);
    }

    public async Task<List<RoleResponse>> GetAllRolesAsync()
    {
        var roles = await db.Roles.ToListAsync();
        return roles.Select(ConvertToDto).ToList();
    }

    public async Task<RoleResponse> GetRoleByIdAsync(long id)
    {
        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new PlayerServiceException("Role not found", HttpStatusCode.NotFound);
        return ConvertToDto(role);
    }

    public async Task DeleteRoleAsync(long id)
    {
        var role = await db.Roles.Include(r => r.Players).FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new PlayerServiceException("Role not found", HttpStatusCode.NotFound);

        if (role.Players.Count > 0)
        {
            throw new PlayerServiceException("Cannot delete role that is assigned to players", HttpStatusCode.BadRequest);
        }

        db.Roles.Remove(role);
        await db.SaveChangesAsync();
    }

    public async Task<List<PlayerWithRolesResponse>> BatchAssignRolesToPlayersAsync(PlayerRoleAssignmentRequest request)
    {
        var allRoleIds = request.PlayerRoleMappings.Values.SelectMany(v => v).ToHashSet();

        var roleCache = new Dictionary<long, Role>();
        foreach (var roleId in allRoleIds)
        {
            var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == roleId)
                ?? throw new PlayerServiceException($"Role with ID {roleId} not found", HttpStatusCode.NotFound);
            roleCache[roleId] = role;
        }

        var playersToUpdate = new List<Player>();
        foreach (var (playerId, roleIds) in request.PlayerRoleMappings)
        {
            var player = await db.Players.Include(p => p.Roles).FirstOrDefaultAsync(p => p.Id == playerId)
                ?? throw new PlayerServiceException($"Player with ID {playerId} not found", HttpStatusCode.NotFound);

            var rolesToAssign = roleIds.Select(id => roleCache[id]).ToHashSet();

            ValidateRoleAssignment(player, rolesToAssign);

            player.Roles = rolesToAssign;
            playersToUpdate.Add(player);
        }

        await db.SaveChangesAsync();

        return playersToUpdate.Select(ConvertPlayerToDto).ToList();
    }

    public async Task<List<PlayerWithRolesResponse>> GetAllPlayersWithRolesAsync()
    {
        var players = await db.Players.Include(p => p.Roles)
            .OrderByDescending(p => p.Id)
            .Take(PaginationDefaults.MaxListSize)
            .ToListAsync();
        return players.Select(ConvertPlayerToDto).ToList();
    }

    public async Task<PlayerWithRolesResponse> GetPlayerWithRolesAsync(long playerId)
    {
        var player = await db.Players.Include(p => p.Roles).FirstOrDefaultAsync(p => p.Id == playerId)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);
        return ConvertPlayerToDto(player);
    }

    /// <summary>
    /// 1) no player can have empty roles; 2) all players must keep at least PLAYER role;
    /// 3) the configured superadmin (Player:SuperAdminEmail) can't lose SUPERADMIN.
    /// </summary>
    private void ValidateRoleAssignment(Player player, HashSet<Role> newRoles)
    {
        if (newRoles.Count == 0)
        {
            throw new PlayerServiceException(
                $"Player ({player.Email}) must have at least one role. Cannot assign empty roles.",
                HttpStatusCode.BadRequest);
        }

        if (!newRoles.Any(r => r.Name == PlayerRoleNames.Player))
        {
            throw new PlayerServiceException(
                $"Player ({player.Email}) must have at least PLAYER role",
                HttpStatusCode.BadRequest);
        }

        var superAdminEmail = playerOptions.Value.SuperAdminEmail;
        if (!string.IsNullOrEmpty(superAdminEmail)
            && string.Equals(superAdminEmail, player.Email, StringComparison.OrdinalIgnoreCase))
        {
            var hasSuperAdmin = player.Roles.Any(r => r.Name == PlayerRoleNames.SuperAdmin);
            if (hasSuperAdmin)
            {
                var superAdminInNewRoles = newRoles.Any(r => r.Name == PlayerRoleNames.SuperAdmin);
                if (!superAdminInNewRoles)
                {
                    throw new PlayerServiceException(
                        $"Cannot remove SUPERADMIN role from superadmin user ({player.Email})",
                        HttpStatusCode.BadRequest);
                }
            }
        }
    }

    private static RoleResponse ConvertToDto(Role role) => new() { Id = role.Id, Name = role.Name };

    private static PlayerWithRolesResponse ConvertPlayerToDto(Player player) => new()
    {
        Id = player.Id,
        Name = player.Name,
        Email = player.Email,
        MobileNo = player.MobileNo,
        TeamsId = player.TeamsId,
        EmployeeId = player.EmployeeId,
        IsActive = player.IsActive,
        PlayingPosition = player.Position,
        Roles = player.Roles.Select(ConvertToDto).ToList(),
    };
}
