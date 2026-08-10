using BofcBackend.Api.Features.MatchDays.Models;

namespace BofcBackend.Api.Features.MatchDays;

public interface IMatchDayService
{
    Task<MatchDayResponse> SaveMatchDayAsync(MatchDayRequest request);
    Task<MatchDayResponse> GetMatchDayByIdAsync(long id);
    Task UpdateMatchDayStatusAsync(long id, bool active);
    Task<PaginatedMatchDayResponse> GetAllMatchDayAsync(int offset, int pageSize, string sortedBy,
        string sortDirection, string? searchColumn, string? searchValue);
    Task<MatchDayResponse> UpdateMatchDayAsync(long id, MatchDayUpdateRequest request);

    /// <summary>Port of MatchDayServiceImpl.updateMatchDayStatuses — invoked by the
    /// daily/scheduled job (see Phase 3's MatchDaySchedulerService port).</summary>
    Task UpdateMatchDayStatusesAsync();

    Task ConcludeMatchDayAsync(long matchDayId);

    /// <summary>Permanently deletes a MatchDay and every row that references it (fixtures, teams,
    /// lineups, rounds/groups, auction data, prizes, participants, goalkeeping history) — cannot
    /// be undone. Unlike ConcludeMatchDayAsync/UpdateMatchDayStatusAsync, this actually removes
    /// rows rather than just changing status.</summary>
    Task HardDeleteMatchDayAsync(long matchDayId);

    Task<MatchDayResponse> GetMostRecentMatchDayAsync();
    Task<MatchDayResponse?> GetMostRecentActiveMatchDayAsync();

    /// <summary>The current/upcoming auto-created "Match Day" (IsWeeklyMatchDay=true) — null if the scheduler hasn't created one yet (e.g. the feature was just enabled).</summary>
    Task<MatchDayResponse?> GetCurrentMatchDayAsync();
    Task<List<MatchDayListResponse>> GetMatchDayListAsync(string? year);
    Task<List<string>> GetMatchDaySessionsAsync();
}
