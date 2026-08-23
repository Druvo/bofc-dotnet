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

    /// <summary>Admin-only skill/seniority rank used to balance auto-generated Match Day teams - never surfaced through the public PlayerResponse (GetAllPlayers/GetPlayerById are anonymous-readable).</summary>
    Task<int?> GetPlayerRankAsync(long id);

    /// <summary>Admin-only - see Player.Rank for what this drives.</summary>
    Task SetPlayerRankAsync(long id, int? rank);

    /// <summary>Admin-only opt-out from goalkeeper auto-assignment - see Player.ExcludeFromGoalkeeperRotation.</summary>
    Task<bool> GetGoalkeeperRotationExclusionAsync(long id);

    /// <summary>Admin-only - see Player.ExcludeFromGoalkeeperRotation for what this drives.</summary>
    Task SetGoalkeeperRotationExclusionAsync(long id, bool excluded);

    /// <summary>Every player plus its current Rank, ordered by rank (unranked last) - feeds the
    /// admin drag-and-drop rank board. Multiple players can share the same Rank (it's a tier,
    /// e.g. 1-10, not a unique position), so this is a plain list, not a ranking.</summary>
    Task<List<PlayerRankListItemResponse>> GetPlayerRanksAsync();

    /// <summary>Sets the logged-in caller's own theme preference - synced across devices via the player row instead of localStorage.</summary>
    Task UpdateOwnThemePreferenceAsync(string? themePreference);
    Task<int> CountActivePlayersAsync();
    Task<Dictionary<int, List<GoalKeeperHistoryDto>>> GoalKeepingHistoryAsync();
    Task<List<GoalKeeperHistoryDto>> GetGoalKeeperHistoryByLoggedInUserAsync();
    Task<List<GoalKeeperHistoryDto>> GetGoalKeeperHistoryByPlayerIdAsync(long playerId);
    Task<GoalKeeperQueueResponseDto> GetGoalKeeperPriorityQueueAsync(long matchDayId);

    /// <summary>Every MatchDay this player captained their Team for - derived from TeamPlayer.IsCaptain,
    /// no separate history table needed since each MatchDay's Team/TeamPlayer rows already persist.</summary>
    Task<List<CaptainHistoryDto>> GetCaptainHistoryByPlayerIdAsync(long playerId);

    /// <summary>Port of PlayerService.getPlayerEntity(Long) - used by other domains (e.g. accounting) that need the raw entity.</summary>
    Task<Player> GetPlayerEntityAsync(long id);

    /// <summary>Port of PlayerService.getPlayerResponse(Player).</summary>
    PlayerResponse GetPlayerResponse(Player player);

    /// <summary>Port of PlayerService.getPlayerResponses(Set&lt;Player&gt;).</summary>
    HashSet<PlayerResponse> GetPlayerResponses(IEnumerable<Player> players);
}
