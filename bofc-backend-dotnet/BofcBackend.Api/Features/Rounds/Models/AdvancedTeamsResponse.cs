namespace BofcBackend.Api.Features.Rounds.Models;

public class AdvancedTeamsResponse
{
    public long SourceRoundId { get; set; }
    public string? SourceRoundName { get; set; }
    public long TargetRoundId { get; set; }
    public string? TargetRoundName { get; set; }
    public int TeamsAdvanced { get; set; }
    public List<TeamAdvancementInfo> Teams { get; set; } = [];

    public class TeamAdvancementInfo
    {
        public long TeamId { get; set; }
        public string? TeamName { get; set; }
        public string? FromGroup { get; set; }
        public int? Position { get; set; }
        public int? Points { get; set; }
        public int? AssignedToSeed { get; set; }
        public string? AdvancementReason { get; set; }
    }
}
