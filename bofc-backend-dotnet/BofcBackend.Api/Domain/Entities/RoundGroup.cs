using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/RoundGroup.java.</summary>
public class RoundGroup : AuditableEntity
{
    public long Id { get; set; }

    public long RoundId { get; set; }
    public MatchDayRound Round { get; set; } = null!;

    public long? ParentGroupId { get; set; }
    public RoundGroup? ParentGroup { get; set; }
    public ICollection<RoundGroup> ChildGroups { get; set; } = new List<RoundGroup>();

    public string GroupName { get; set; } = string.Empty;
    public GroupFormat? GroupFormat { get; set; }
    public string? AdvancementRuleText { get; set; }
    public int? MaxTeams { get; set; }
    public RoundStatus Status { get; set; }

    public ICollection<RoundGroupTeam> GroupTeams { get; set; } = new List<RoundGroupTeam>();
    public ICollection<Match> Matches { get; set; } = new List<Match>();
    public ICollection<GroupStanding> Standings { get; set; } = new List<GroupStanding>();
    public ICollection<AdvancementRule> AdvancementRules { get; set; } = new List<AdvancementRule>();
}
