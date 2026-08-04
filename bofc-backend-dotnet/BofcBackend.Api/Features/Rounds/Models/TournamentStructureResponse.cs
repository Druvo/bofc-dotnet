namespace BofcBackend.Api.Features.Rounds.Models;

public class TournamentStructureResponse
{
    public long TournamentId { get; set; }
    public string TournamentName { get; set; } = string.Empty;
    public string? SportType { get; set; }
    public string? TournamentType { get; set; }
    public string? Status { get; set; }
    public List<TournamentRoundResponse> Rounds { get; set; } = [];
    public int TotalRounds { get; set; }
    public int TotalMatches { get; set; }
    public int CompletedMatches { get; set; }
}
