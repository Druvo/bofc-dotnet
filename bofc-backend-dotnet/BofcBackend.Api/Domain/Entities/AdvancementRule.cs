using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/AdvancementRule.java.</summary>
public class AdvancementRule : AuditableEntity
{
    public long Id { get; set; }

    public long SourceRoundId { get; set; }
    public MatchDayRound SourceRound { get; set; } = null!;

    public long? SourceGroupId { get; set; }
    public RoundGroup? SourceGroup { get; set; }

    public long TargetRoundId { get; set; }
    public MatchDayRound TargetRound { get; set; } = null!;

    public long? TargetGroupId { get; set; }
    public RoundGroup? TargetGroup { get; set; }

    public AdvancementRuleType RuleType { get; set; }
    public string RuleConfig { get; set; } = string.Empty;
    public int? PriorityOrder { get; set; }
}
