using BofcBackend.Api.Features.Tournaments.Models;

namespace BofcBackend.Api.Features.Tournaments;

public interface ITournamentService
{
    Task<TournamentResponse> SaveTournamentAsync(TournamentRequest request);
    Task<TournamentResponse> GetTournamentByIdAsync(long id);
    Task UpdateTournamentStatusAsync(long id, bool active);
    Task<PaginatedTournamentResponse> GetAllTournamentAsync(int offset, int pageSize, string sortedBy,
        string sortDirection, string? searchColumn, string? searchValue);
    Task<TournamentResponse> UpdateTournamentAsync(long id, TournamentUpdateRequest request);

    /// <summary>Port of TournamentServiceImpl.updateTournamentStatuses — invoked by the
    /// daily/scheduled job (see Phase 3's TournamentSchedulerService port).</summary>
    Task UpdateTournamentStatusesAsync();

    Task ConcludeTournamentAsync(long tournamentId);
    Task<TournamentResponse> GetMostRecentTournamentAsync();
    Task<TournamentResponse?> GetMostRecentActiveTournamentAsync();
    Task<List<TournamentListResponse>> GetTournamentListAsync(string? year);
    Task<List<string>> GetTournamentSessionsAsync();
}
