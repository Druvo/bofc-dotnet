namespace BofcBackend.Api.Features.Players.Models;

public class GoalKeeperHistoryDto
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public int? RoundNumber { get; set; }
    public DateTime? PlayedDate { get; set; }
    public long? MatchDayId { get; set; }
    public string? MatchDayName { get; set; }
    public string? VenueName { get; set; }
}
