using BofcBackend.Api.Features.Tournaments.Models;

namespace BofcBackend.Api.Features.TournamentParticipants.Models;

public class LatestTournamentWithUserParticipantsResponse
{
    public TournamentResponse Tournament { get; set; } = null!;
    public int TotalParticipant { get; set; }
    public int RemainParticipant { get; set; }
    public int TotalPlayer { get; set; }
    public bool? IsUserParticipated { get; set; }
    public long? TournamentParticipantId { get; set; }
}
