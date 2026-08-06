using BofcBackend.Api.Features.MatchDays.Models;

namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class LatestMatchDayWithUserParticipantsResponse
{
    public MatchDayResponse MatchDay { get; set; } = null!;
    public int TotalParticipant { get; set; }
    public int RemainParticipant { get; set; }
    public int TotalPlayer { get; set; }
    public bool? IsUserParticipated { get; set; }
    public long? MatchDayParticipantId { get; set; }
}
