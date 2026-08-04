namespace BofcBackend.Api.Features.Players.Models;

public class GoalKeeperQueueResponseDto
{
    public long TournamentId { get; set; }
    public string TournamentName { get; set; } = string.Empty;
    public DateTime TournamentDate { get; set; }
    public List<GoalKeeperPriorityDto> GoalKeeperPriorityQueue { get; set; } = [];
}
