namespace BofcBackend.Api.Features.Tournaments.Models;

public class PaginatedTournamentResponse(List<TournamentResponse> tournaments, long totalCount)
{
    public List<TournamentResponse> Tournaments { get; } = tournaments;
    public long TotalCount { get; } = totalCount;
}
