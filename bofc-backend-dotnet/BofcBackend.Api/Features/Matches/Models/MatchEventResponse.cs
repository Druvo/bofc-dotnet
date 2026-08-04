namespace BofcBackend.Api.Features.Matches.Models;

public class MatchEventResponse
{
    public long Id { get; set; }
    public long MatchId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public long? PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public long? TeamId { get; set; }
    public string? TeamName { get; set; }
    public int EventTime { get; set; }
    public string? Description { get; set; }
    public long? RelatedPlayerId { get; set; }
    public string? RelatedPlayerName { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedDate { get; set; }
}
