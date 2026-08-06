using BofcBackend.Api.Features.MatchDays.Models;

namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class LatestMatchDayWithParticipantsResponse
{
    public MatchDayResponse MatchDay { get; set; } = null!;
    public int TotalParticipant { get; set; }
    public int RemainParticipant { get; set; }
    public int TotalPlayer { get; set; }
}
