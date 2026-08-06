namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class GoalkeeperStatsResponse
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public long GoalkeeperCount { get; set; }
}
