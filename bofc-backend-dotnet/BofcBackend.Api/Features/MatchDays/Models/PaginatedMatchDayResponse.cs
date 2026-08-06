namespace BofcBackend.Api.Features.MatchDays.Models;

public class PaginatedMatchDayResponse(List<MatchDayResponse> MatchDays, long totalCount)
{
    public List<MatchDayResponse> MatchDays { get; } = MatchDays;
    public long TotalCount { get; } = totalCount;
}
