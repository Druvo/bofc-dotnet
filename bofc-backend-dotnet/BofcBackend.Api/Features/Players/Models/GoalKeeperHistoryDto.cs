namespace BofcBackend.Api.Features.Players.Models;

public class GoalKeeperHistoryDto
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public int? RoundNumber { get; set; }
    public DateTime? PlayedDate { get; set; }
}
