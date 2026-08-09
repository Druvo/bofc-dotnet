namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class MatchDayWithPlayersResponse
{
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public DateTime? MatchDayDate { get; set; }
    public int? DurationMinutes { get; set; }
    public long TotalParticipants { get; set; }
    public List<PlayerParticipationResponse> Players { get; set; } = [];
}
