namespace BofcBackend.Api.Features.Players.Models;

public class GoalKeeperQueueResponseDto
{
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public DateTime MatchDayDate { get; set; }
    public List<GoalKeeperPriorityDto> GoalKeeperPriorityQueue { get; set; } = [];
}
