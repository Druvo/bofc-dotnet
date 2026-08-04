namespace BofcBackend.Api.Features.Rounds.Models;

public class TournamentRoundResponse
{
    public long Id { get; set; }
    public long TournamentId { get; set; }
    public string? TournamentName { get; set; }
    public int RoundNumber { get; set; }
    public string RoundName { get; set; } = string.Empty;
    public string RoundType { get; set; } = string.Empty;
    public string? AdvancementRule { get; set; }
    public string Status { get; set; } = string.Empty;
    public int SequenceOrder { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public List<RoundGroupResponse>? Groups { get; set; }
    public List<TeamSimpleResponse>? Teams { get; set; }
    public int TotalMatches { get; set; }
    public int CompletedMatches { get; set; }

    /// <summary>
    /// IDs of the rounds that feed into this one, derived from the bracket's logic-node edges
    /// (source -&gt; target). Empty for an entry round. Used to gate "Start Round" on the actual
    /// predecessors rather than the adjacent sequence number, so parallel brackets (e.g. Cup vs
    /// Plate) stay independent.
    /// </summary>
    public List<long> SourceRoundIds { get; set; } = [];
}
