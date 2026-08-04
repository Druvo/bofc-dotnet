using BofcBackend.Api.Features.Tournaments.Models;

namespace BofcBackend.Api.Features.TournamentParticipants.Models;

public class LatestTournamentWithParticipantsResponse
{
    public TournamentResponse Tournament { get; set; } = null!;
    public int TotalParticipant { get; set; }
    public int RemainParticipant { get; set; }
    public int TotalPlayer { get; set; }
}
