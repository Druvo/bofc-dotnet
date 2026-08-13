namespace BofcBackend.Api.Features.Players.Models;

public class CaptainHistoryDto
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public DateTime MatchDayDate { get; set; }
    public string TeamName { get; set; } = string.Empty;
}
