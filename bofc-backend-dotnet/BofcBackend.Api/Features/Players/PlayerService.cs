using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Common.Storage;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Players.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Players;

/// <summary>Port of service/PlayerServiceImpl.java.</summary>
public class PlayerService(
    BofcDbContext db,
    ICurrentUserService currentUser,
    IOptions<PlayerOptions> playerOptions,
    [FromKeyedServices("player-profile")] IStorageProvider storageProvider,
    [FromKeyedServices("player-photo")] IMediaStorageProvider playerPhotoStorageProvider) : IPlayerService
{
    public async Task RegisterPlayerAsync(PlayerRegistrationRequest request)
    {
        if (await db.Players.AnyAsync(p => p.Email == request.Email))
        {
            throw new PlayerServiceException(RestErrorMessageDetail.PlayerAlreadyExists, HttpStatusCode.Conflict);
        }

        var playerRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == PlayerRoleNames.Player)
            ?? throw new PlayerServiceException("Role PLAYER not found", HttpStatusCode.NotFound);

        var player = new Player
        {
            Email = request.Email,
            Name = request.Name,
            EmployeeId = request.EmployeeId,
            MobileNo = request.MobileNo,
            TeamsId = request.TeamsId,
            Position = request.PlayingPosition!.Value,
            JerseyNumber = request.JerseyNumber,
            ProfilePhoto = request.ProfilePhoto,
            PhotoKey = request.PhotoKey,
            IsActive = false,
            Password = BCrypt.Net.BCrypt.HashPassword(playerOptions.Value.DefaultPassword),
            LastPasswordChangeDate = null,
            Roles = [playerRole],
        };

        db.Players.Add(player);
        await db.SaveChangesAsync();
    }

    public async Task<List<PlayerResponse>> GetAllPlayersAsync()
    {
        var players = await db.Players.Include(p => p.Roles)
            .OrderByDescending(p => p.Id).Take(PaginationDefaults.MaxListSize).ToListAsync();
        return players.Select(ToResponse).ToList();
    }

    public async Task<PlayerResponse> GetPlayerByIdAsync(long id) => ToResponse(await GetPlayerEntityAsync(id));

    public async Task UpdatePlayerStatusAsync(long id, bool active)
    {
        var player = await GetPlayerEntityAsync(id);
        player.IsActive = active;
        await db.SaveChangesAsync();
    }

    public async Task<PlayerResponse> UpdatePlayerAsync(long id, PlayerUpdateRequest request)
    {
        if (!currentUser.IsUserAuthorizedForSelf(id)
            && !currentUser.IsInRole(PlayerRoleNames.Admin) && !currentUser.IsInRole(PlayerRoleNames.SuperAdmin))
        {
            // Java throws the JDK's own java.lang.SecurityException here (unhandled by the
            // global exception handler, which only maps the app's own SecurityException type)
            // - almost certainly an accidental wrong-class import rather than an intentional
            // "let it 500" design, since every other unauthorized-action check in this codebase
            // uses the app exception. Using BofcSecurityException here for a real 403 response.
            throw new BofcSecurityException(RestErrorMessageDetail.NotAuthorizedForAction, HttpStatusCode.Forbidden);
        }

        var existingWithEmail = await db.Players.FirstOrDefaultAsync(p => p.Email == request.Email);
        if (existingWithEmail != null && existingWithEmail.Id != id)
        {
            throw new BofcSecurityException(RestErrorMessageDetail.EmailAlreadyInUse, HttpStatusCode.ExpectationFailed);
        }

        var existingWithEmployeeId = await db.Players.FirstOrDefaultAsync(p => p.EmployeeId == request.EmployeeId);
        if (existingWithEmployeeId != null && existingWithEmployeeId.Id != id)
        {
            throw new BofcSecurityException(RestErrorMessageDetail.EmployeeIdAlreadyInUse, HttpStatusCode.ExpectationFailed);
        }

        var existingWithTeamsId = await db.Players.FirstOrDefaultAsync(p => p.TeamsId == request.TeamsId);
        if (existingWithTeamsId != null && existingWithTeamsId.Id != id)
        {
            throw new BofcSecurityException(RestErrorMessageDetail.TeamsIdAlreadyInUse, HttpStatusCode.ExpectationFailed);
        }

        var player = await GetPlayerEntityAsync(id);
        player.Email = request.Email;
        player.Name = request.Name;
        player.EmployeeId = request.EmployeeId;
        player.MobileNo = StringUtils.NormalizeString(request.MobileNo);
        player.TeamsId = request.TeamsId;
        player.Position = request.PlayingPosition!.Value;
        player.JerseyNumber = request.JerseyNumber;

        // Capture old storage keys but don't delete the files yet - deleting before the DB
        // commit succeeds would leave a dangling reference if SaveChangesAsync fails.
        string? oldProfilePhotoKey = null;
        if (!string.IsNullOrWhiteSpace(request.ProfilePhoto))
        {
            var oldKey = player.ProfilePhoto;
            if (!string.IsNullOrWhiteSpace(oldKey) && oldKey != request.ProfilePhoto)
            {
                oldProfilePhotoKey = oldKey;
            }
        }
        player.ProfilePhoto = request.ProfilePhoto;

        string? oldPhotoKey = null;
        if (!string.IsNullOrWhiteSpace(request.PhotoKey))
        {
            if (!string.IsNullOrEmpty(player.PhotoKey) && player.PhotoKey != request.PhotoKey)
            {
                oldPhotoKey = player.PhotoKey;
            }
            player.PhotoKey = request.PhotoKey;
        }

        await db.SaveChangesAsync();

        // Only delete the old files once the DB update has actually committed.
        if (oldProfilePhotoKey != null)
        {
            await storageProvider.DeleteAsync(oldProfilePhotoKey);
        }
        if (oldPhotoKey != null)
        {
            await playerPhotoStorageProvider.DeleteAsync(oldPhotoKey);
        }

        // Roles are intentionally not touched here - only admin-specific role management
        // (not yet ported) should change a player's roles.
        return ToResponse(player);
    }

    public async Task<int?> GetPlayerRankAsync(long id) => (await GetPlayerEntityAsync(id)).Rank;

    public async Task SetPlayerRankAsync(long id, int? rank)
    {
        var player = await GetPlayerEntityAsync(id);
        player.Rank = rank;
        await db.SaveChangesAsync();
    }

    public async Task<List<PlayerRankListItemResponse>> GetPlayerRanksAsync()
    {
        var players = await db.Players
            .OrderBy(p => p.Rank ?? int.MaxValue).ThenBy(p => p.Name)
            .ToListAsync();

        return players.Select(p => new PlayerRankListItemResponse
        {
            PlayerId = p.Id,
            Name = p.Name,
            PhotoUrl = p.PhotoKey != null ? $"/files/player-photos/{p.PhotoKey}" : null,
            JerseyNumber = p.JerseyNumber,
            IsActive = p.IsActive,
            Rank = p.Rank,
        }).ToList();
    }

    public async Task UpdateOwnThemePreferenceAsync(string? themePreference)
    {
        var player = await GetPlayerEntityAsync(currentUser.GetPlayerId());
        player.ThemePreference = themePreference;
        await db.SaveChangesAsync();
    }

    public async Task<int> CountActivePlayersAsync() => await db.Players.CountAsync(p => p.IsActive);

    public async Task<Dictionary<int, List<GoalKeeperHistoryDto>>> GoalKeepingHistoryAsync()
    {
        var rows = await (
            from p in db.Players
            where p.IsActive
            join h in db.PlayerGoalkeepingHistories on p.Id equals h.PlayerId into gj
            from h in gj.DefaultIfEmpty()
            select new GoalKeeperHistoryDto
            {
                PlayerId = p.Id,
                PlayerName = p.Name,
                RoundNumber = h != null ? h.RoundNumber : (int?)null,
                PlayedDate = h != null ? h.PlayedDate : (DateTime?)null,
            }).ToListAsync();

        var allPlayerIds = rows.Select(r => r.PlayerId).Distinct().ToHashSet();

        var groupedByRound = new SortedDictionary<int, List<GoalKeeperHistoryDto>>(Comparer<int>.Create((a, b) => b.CompareTo(a)));
        foreach (var row in rows)
        {
            var roundKey = row.RoundNumber is null or 0 ? 1 : row.RoundNumber.Value;
            if (!groupedByRound.TryGetValue(roundKey, out var list))
            {
                list = [];
                groupedByRound[roundKey] = list;
            }
            list.Add(row);
        }

        foreach (var (roundNumber, roundList) in groupedByRound)
        {
            var playersInThisRound = roundList.Select(r => r.PlayerId).ToHashSet();
            foreach (var playerId in allPlayerIds.Where(id => !playersInThisRound.Contains(id)))
            {
                var first = rows.FirstOrDefault(r => r.PlayerId == playerId);
                if (first != null)
                {
                    roundList.Add(new GoalKeeperHistoryDto
                    {
                        PlayerId = first.PlayerId,
                        PlayerName = first.PlayerName,
                        RoundNumber = roundNumber,
                        PlayedDate = null,
                    });
                }
            }

            // Nulls (placeholders) sort last; otherwise newest first, then playerId tiebreaker.
            roundList.Sort((a, b) =>
            {
                if (a.PlayedDate is null && b.PlayedDate is null)
                {
                    return a.PlayerId.CompareTo(b.PlayerId);
                }
                if (a.PlayedDate is null)
                {
                    return 1;
                }
                if (b.PlayedDate is null)
                {
                    return -1;
                }
                var cmp = b.PlayedDate.Value.CompareTo(a.PlayedDate.Value);
                return cmp != 0 ? cmp : a.PlayerId.CompareTo(b.PlayerId);
            });
        }

        return groupedByRound.ToDictionary(kv => kv.Key, kv => kv.Value);
    }

    public Task<List<GoalKeeperHistoryDto>> GetGoalKeeperHistoryByLoggedInUserAsync() =>
        GetGoalKeeperHistoryByPlayerIdAsync(currentUser.GetPlayerId());

    public async Task<List<GoalKeeperHistoryDto>> GetGoalKeeperHistoryByPlayerIdAsync(long playerId)
    {
        var histories = await db.PlayerGoalkeepingHistories.Include(h => h.Player)
            .Where(h => h.PlayerId == playerId)
            .OrderByDescending(h => h.RoundNumber)
            .ToListAsync();

        return histories.Select(h => new GoalKeeperHistoryDto
        {
            PlayerId = h.Player.Id,
            PlayerName = h.Player.Name,
            RoundNumber = h.RoundNumber,
            PlayedDate = h.PlayedDate,
        }).ToList();
    }

    public async Task<GoalKeeperQueueResponseDto> GetGoalKeeperPriorityQueueAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new PlayerServiceException("MatchDay not found", HttpStatusCode.NotFound);

        var mostRecentMatchDay = await db.MatchDays
            .Where(t => t.MatchDayDate < matchDay.MatchDayDate)
            .OrderByDescending(t => t.MatchDayDate)
            .FirstOrDefaultAsync();

        var participants = await db.MatchDayParticipants.Include(p => p.Player)
            .Where(p => p.MatchDayId == matchDayId && p.ParticipationStatus)
            .ToListAsync();

        if (participants.Count == 0)
        {
            return new GoalKeeperQueueResponseDto
            {
                MatchDayId = matchDayId,
                MatchDayName = matchDay.Name,
                MatchDayDate = matchDay.MatchDayDate,
                GoalKeeperPriorityQueue = [],
            };
        }

        // Total active MatchDays for frequency calculation (prevent division by zero).
        var activeMatchDayCount = await db.MatchDays.CountAsync(t => t.IsActive);
        if (activeMatchDayCount == 0)
        {
            activeMatchDayCount = 1;
        }

        var playersWithMetadata = new List<(GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays)>();

        foreach (var participant in participants)
        {
            var player = participant.Player;

            var totalGkMatchDays = await db.PlayerGoalkeepingHistories
                .CountAsync(h => h.PlayerId == player.Id && h.MatchDayId != matchDayId);

            var totalMatchDayParticipations = await db.MatchDayParticipants
                .Where(p => p.PlayerId == player.Id && p.ParticipationStatus)
                .Select(p => p.MatchDayId).Distinct().CountAsync();

            var lastGoalKeeperDate = await db.PlayerGoalkeepingHistories
                .Where(h => h.PlayerId == player.Id).MaxAsync(h => (DateTime?)h.PlayedDate);

            var consecutiveMissedMatchDays = await CountConsecutiveMissedMatchDaysBeforeCurrentAsync(player.Id, matchDayId);

            // All GK dates for display, excluding the current MatchDay and any future ones
            // relative to it - only past MatchDays count.
            var allGoalKeeperDates = await db.PlayerGoalkeepingHistories
                .Where(h => h.PlayerId == player.Id && h.MatchDayId != matchDayId && h.PlayedDate < matchDay.MatchDayDate)
                .OrderByDescending(h => h.PlayedDate)
                .Select(h => h.PlayedDate)
                .ToListAsync();
            var formattedGoalKeeperDates = allGoalKeeperDates.Select(d => d.ToString("dd-MM-yy")).ToList();

            var wasGkInMostRecent = mostRecentMatchDay != null && await db.PlayerGoalkeepingHistories
                .AnyAsync(h => h.PlayerId == player.Id && h.MatchDayId == mostRecentMatchDay.Id);

            var lastParticipationDate = await db.MatchDayParticipants
                .Where(p => p.PlayerId == player.Id && p.ParticipationStatus && p.MatchDayId != matchDayId
                    && p.MatchDay.MatchDayDate < matchDay.MatchDayDate)
                .MaxAsync(p => (DateTime?)p.MatchDay.MatchDayDate);
            var lastPlayedMatchDayDate = lastParticipationDate?.ToString("dd-MM-yy");

            var participationFrequency = activeMatchDayCount > 0
                ? totalMatchDayParticipations * 100.0 / activeMatchDayCount
                : 0.0;

            var dto = new GoalKeeperPriorityDto
            {
                PlayerId = player.Id,
                PlayerName = player.Name,
                EmployeeId = player.EmployeeId,
                PlayAsGkDates = formattedGoalKeeperDates,
                TotalMatchDayParticipations = totalMatchDayParticipations,
                ActiveMatchDayCount = activeMatchDayCount,
                ParticipationFrequency = Math.Round(participationFrequency, 2),
                LastPlayedMatchDayDate = lastPlayedMatchDayDate,
                TotalGoalKeeperMatchDays = totalGkMatchDays,
                LastGoalKeeperDate = lastGoalKeeperDate,
            };

            playersWithMetadata.Add((dto, wasGkInMostRecent, consecutiveMissedMatchDays));
        }

        // Category-based ordering.
        var regularPlayers = new List<(GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays)>();
        var lastMatchDayGk = new List<(GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays)>();
        var brandNewPlayers = new List<(GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays)>();

        foreach (var metadata in playersWithMetadata)
        {
            // Brand new: participating in the current MatchDay AND never participated before
            // in any MatchDay (totalParticipations == 1 means only the current one;
            // consecutiveMissed == activeCount - 1 means every prior MatchDay was missed).
            var isBrandNew = metadata.Dto.TotalMatchDayParticipations == 1
                && metadata.ConsecutiveMissedMatchDays == metadata.Dto.ActiveMatchDayCount - 1;

            if (isBrandNew)
            {
                brandNewPlayers.Add(metadata);
            }
            else if (metadata.WasGkInMostRecent)
            {
                lastMatchDayGk.Add(metadata);
            }
            else
            {
                regularPlayers.Add(metadata);
            }
        }

        // Regular-player ordering: never-GK first, then fewer consecutive missed MatchDays
        // (more regular attendance), then fewer total GK times (fair burden distribution), then
        // older lastGoalKeeperDate, then playerId as a tiebreaker.
        int RegularComparer(
            (GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays) a,
            (GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays) b)
        {
            var cmp = (a.Dto.LastGoalKeeperDate == null ? 0 : 1).CompareTo(b.Dto.LastGoalKeeperDate == null ? 0 : 1);
            if (cmp != 0) return cmp;
            cmp = a.ConsecutiveMissedMatchDays.CompareTo(b.ConsecutiveMissedMatchDays);
            if (cmp != 0) return cmp;
            cmp = a.Dto.TotalGoalKeeperMatchDays.CompareTo(b.Dto.TotalGoalKeeperMatchDays);
            if (cmp != 0) return cmp;
            cmp = CompareNullsLastAscending(a.Dto.LastGoalKeeperDate, b.Dto.LastGoalKeeperDate);
            return cmp != 0 ? cmp : a.Dto.PlayerId.CompareTo(b.Dto.PlayerId);
        }

        // Last-MatchDay-GK ordering: prioritize LESS experienced GKs first (fewer times
        // played), then older lastGoalKeeperDate, then playerId.
        int LastGkComparer(
            (GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays) a,
            (GoalKeeperPriorityDto Dto, bool WasGkInMostRecent, int ConsecutiveMissedMatchDays) b)
        {
            var cmp = a.Dto.TotalGoalKeeperMatchDays.CompareTo(b.Dto.TotalGoalKeeperMatchDays);
            if (cmp != 0) return cmp;
            cmp = CompareNullsLastAscending(a.Dto.LastGoalKeeperDate, b.Dto.LastGoalKeeperDate);
            return cmp != 0 ? cmp : a.Dto.PlayerId.CompareTo(b.Dto.PlayerId);
        }

        regularPlayers.Sort(RegularComparer);
        lastMatchDayGk.Sort(LastGkComparer);
        brandNewPlayers.Sort(RegularComparer); // treated like regular players (placed last anyway)

        var finalQueue = new List<GoalKeeperPriorityDto>();
        finalQueue.AddRange(regularPlayers.Select(m => m.Dto));
        finalQueue.AddRange(lastMatchDayGk.Select(m => m.Dto));
        finalQueue.AddRange(brandNewPlayers.Select(m => m.Dto));

        var priority = 1;
        foreach (var dto in finalQueue)
        {
            dto.Priority = priority++;
        }

        return new GoalKeeperQueueResponseDto
        {
            MatchDayId = matchDayId,
            MatchDayName = matchDay.Name,
            MatchDayDate = matchDay.MatchDayDate,
            GoalKeeperPriorityQueue = finalQueue,
        };
    }

    private static int CompareNullsLastAscending(DateTime? a, DateTime? b)
    {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.Value.CompareTo(b.Value);
    }

    /// <summary>
    /// Port of MatchDayParticipantRepository.countConsecutiveMissedMatchDaysBeforeCurrent -
    /// Java's one native-SQL query. No rewrite needed: the target DB stays MySQL (never moved
    /// to SQL Server), so DATE_SUB/NOW() work as-is via Pomelo/MySqlConnector.
    /// </summary>
    private async Task<int> CountConsecutiveMissedMatchDaysBeforeCurrentAsync(long playerId, long currentMatchDayId)
    {
        var rows = await db.Database.SqlQuery<int>($"""
            SELECT COUNT(*) AS Value FROM match_day t
            WHERE t.id != {currentMatchDayId}
            AND t.match_day_date < (SELECT match_day_date FROM match_day WHERE id = {currentMatchDayId})
            AND NOT EXISTS (SELECT 1 FROM match_day_participant tp WHERE tp.match_day_id = t.id AND tp.player_id = {playerId} AND tp.participation_status = true)
            AND t.match_day_date > (SELECT COALESCE(MAX(t2.match_day_date), DATE_SUB(NOW(), INTERVAL 1000 DAY))
                FROM match_day t2 WHERE EXISTS (SELECT 1 FROM match_day_participant tp2 WHERE tp2.match_day_id = t2.id AND tp2.player_id = {playerId} AND tp2.participation_status = true)
                AND t2.match_day_date < (SELECT match_day_date FROM match_day WHERE id = {currentMatchDayId}))
            """).ToListAsync();
        return rows.FirstOrDefault();
    }

    public async Task<Player> GetPlayerEntityAsync(long id) =>
        await db.Players.Include(p => p.Roles).FirstOrDefaultAsync(p => p.Id == id)
        ?? throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

    public PlayerResponse GetPlayerResponse(Player player) => ToResponse(player);

    public HashSet<PlayerResponse> GetPlayerResponses(IEnumerable<Player> players) =>
        players.Select(ToResponse).ToHashSet();

    private static PlayerResponse ToResponse(Player player) => new()
    {
        Id = player.Id,
        Name = player.Name,
        Email = player.Email,
        MobileNo = player.MobileNo,
        TeamsId = player.TeamsId,
        EmployeeId = player.EmployeeId,
        FullName = $"{player.Name}[{player.EmployeeId}]",
        ProfilePhoto = player.ProfilePhoto,
        PlayingPosition = player.Position,
        JerseyNumber = player.JerseyNumber,
        IsActive = player.IsActive,
        Roles = player.Roles.Select(r => new RoleResponse { Id = r.Id, Name = r.Name }).ToHashSet(),
        PhotoKey = player.PhotoKey,
        PhotoUrl = player.PhotoKey != null ? $"/files/player-photos/{player.PhotoKey}" : null,
        ThemePreference = player.ThemePreference,
    };
}
