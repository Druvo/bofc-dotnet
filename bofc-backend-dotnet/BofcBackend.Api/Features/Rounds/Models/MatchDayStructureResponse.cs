namespace BofcBackend.Api.Features.Rounds.Models;

public class MatchDayStructureResponse
{
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public string? SportType { get; set; }
    public string? MatchDayType { get; set; }
    public string? Status { get; set; }
    public List<MatchDayRoundResponse> Rounds { get; set; } = [];
    public int TotalRounds { get; set; }
    public int TotalMatches { get; set; }
    public int CompletedMatches { get; set; }
}
