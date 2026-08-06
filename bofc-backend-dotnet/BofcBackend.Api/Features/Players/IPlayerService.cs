using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Players.Models;

namespace BofcBackend.Api.Features.Players;

/// <summary>Port of service/PlayerService.java.</summary>
public interface IPlayerService
{
    Task RegisterPlayerAsync(PlayerRegistrationRequest request);
    Task<List<PlayerResponse>> GetAllPlayersAsync();
    Task<PlayerResponse> GetPlayerByIdAsync(long id);
    Task UpdatePlayerStatusAsync(long id, bool active);
    Task<PlayerResponse> UpdatePlayerAsync(long id, PlayerUpdateRequest request);

    /// <summary>Sets the logged-in caller's own theme preference — synced across devices via the player row instead of localStorage.</summary>
    Task UpdateOwnThemePreferenceAsync(string? themePreference);
    Task<int> CountActivePlayersAsync();
    Task<Dictionary<int, List<GoalKeeperHistoryDto>>> GoalKeepingHistoryAsync();
    Task<List<GoalKeeperHistoryDto>> GetGoalKeeperHistoryByLoggedInUserAsync();
    Task<List<GoalKeeperHistoryDto>> GetGoalKeeperHistoryByPlayerIdAsync(long playerId);
    Task<GoalKeeperQueueResponseDto> GetGoalKeeperPriorityQueueAsync(long matchDayId);

    /// <summary>Port of PlayerService.getPlayerEntity(Long) — used by other domains (e.g. accounting) that need the raw entity.</summary>
    Task<Player> GetPlayerEntityAsync(long id);

    /// <summary>Port of PlayerService.getPlayerResponse(Player).</summary>
    PlayerResponse GetPlayerResponse(Player player);

    /// <summary>Port of PlayerService.getPlayerResponses(Set&lt;Player&gt;).</summary>
    HashSet<PlayerResponse> GetPlayerResponses(IEnumerable<Player> players);
}
