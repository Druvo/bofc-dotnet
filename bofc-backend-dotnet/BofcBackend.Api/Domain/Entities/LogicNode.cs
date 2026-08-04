using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/LogicNode.java.</summary>
public class LogicNode : AuditableEntity
{
    public long Id { get; set; }

    public long TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;

    public string NodeName { get; set; } = string.Empty;
    public LogicNodeType NodeType { get; set; }

    /// <summary>Nullable — advancement can come from a round instead.</summary>
    public long? SourceRoundId { get; set; }
    public TournamentRound? SourceRound { get; set; }

    /// <summary>Nullable — advancement can come from a group instead.</summary>
    public long? SourceGroupId { get; set; }
    public RoundGroup? SourceGroup { get; set; }

    /// <summary>Required — teams always advance to a round.</summary>
    public long TargetRoundId { get; set; }
    public TournamentRound TargetRound { get; set; } = null!;

    /// <summary>JSON-ish rule config (topN, tieBreakerRules, etc).</summary>
    public string? RuleConfig { get; set; }

    /// <summary>Lower number = higher priority when multiple logic nodes exist.</summary>
    public int? PriorityOrder { get; set; }

    public bool IsActive { get; set; } = true;
    public bool AutoExecute { get; set; } = true;
    public int ExecutionCount { get; set; }
    public DateTime? LastExecutedAt { get; set; }
}
