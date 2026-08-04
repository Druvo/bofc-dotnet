namespace BofcBackend.Api.Features.TournamentParticipants.Models;

public class TournamentWithPlayersResponse
{
    public long TournamentId { get; set; }
    public string TournamentName { get; set; } = string.Empty;
    public DateTime? TournamentDate { get; set; }
    public long TotalParticipants { get; set; }
    public List<PlayerParticipationResponse> Players { get; set; } = [];
}
