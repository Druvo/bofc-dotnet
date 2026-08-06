using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/MatchDayRound.java.</summary>
public class MatchDayRound : AuditableEntity
{
    public long Id { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public int RoundNumber { get; set; }
    public string RoundName { get; set; } = string.Empty;
    public RoundType RoundType { get; set; }
    public string? AdvancementRuleText { get; set; }
    public RoundStatus Status { get; set; }
    public int SequenceOrder { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public ICollection<RoundGroup> Groups { get; set; } = new List<RoundGroup>();
    public ICollection<RoundTeam> Teams { get; set; } = new List<RoundTeam>();
    public ICollection<Match> Matches { get; set; } = new List<Match>();
    public ICollection<AdvancementRule> SourceAdvancementRules { get; set; } = new List<AdvancementRule>();
    public ICollection<AdvancementRule> TargetAdvancementRules { get; set; } = new List<AdvancementRule>();
    public ICollection<LogicNode> SourceLogicNodes { get; set; } = new List<LogicNode>();
    public ICollection<LogicNode> TargetLogicNodes { get; set; } = new List<LogicNode>();
}
