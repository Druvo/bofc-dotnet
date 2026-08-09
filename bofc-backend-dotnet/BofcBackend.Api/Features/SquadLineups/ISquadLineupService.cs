using BofcBackend.Api.Features.SquadLineups.Models;

namespace BofcBackend.Api.Features.SquadLineups;

public interface ISquadLineupService
{
    Task<TeamLineupResponse> GetLineupAsync(long teamId);
    Task<TeamLineupResponse> UpdateLineupAsync(long teamId, UpdateTeamLineupRequest request);
}
