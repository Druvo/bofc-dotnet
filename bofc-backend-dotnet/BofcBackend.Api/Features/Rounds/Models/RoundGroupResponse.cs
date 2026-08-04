namespace BofcBackend.Api.Features.Rounds.Models;

public class RoundGroupResponse
{
    public long Id { get; set; }
    public long RoundId { get; set; }
    public string? RoundName { get; set; }
    public long? ParentGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? GroupFormat { get; set; }
    public string? AdvancementRule { get; set; }
    public int? MaxTeams { get; set; }
    public string? Status { get; set; }

    public List<TeamSimpleResponse>? Teams { get; set; }
    public List<GroupStandingResponse>? Standings { get; set; }
    public List<RoundGroupResponse>? ChildGroups { get; set; }
    public int TotalMatches { get; set; }
    public int CompletedMatches { get; set; }
}
