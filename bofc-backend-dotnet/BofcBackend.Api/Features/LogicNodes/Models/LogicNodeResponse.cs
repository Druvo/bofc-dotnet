namespace BofcBackend.Api.Features.LogicNodes.Models;

/// <summary>Port of model/LogicNodeResponse.java.</summary>
public class LogicNodeResponse
{
    public long Id { get; set; }
    public long TournamentId { get; set; }
    public string? TournamentName { get; set; }
    public string NodeName { get; set; } = string.Empty;
    public string NodeType { get; set; } = string.Empty;
    public long? SourceRoundId { get; set; }
    public string? SourceRoundName { get; set; }
    public long? SourceGroupId { get; set; }
    public string? SourceGroupName { get; set; }
    public long TargetRoundId { get; set; }
    public string? TargetRoundName { get; set; }
    public string? RuleConfig { get; set; }
    public int? PriorityOrder { get; set; }
    public bool IsActive { get; set; }
    public bool AutoExecute { get; set; }
    public int ExecutionCount { get; set; }
    public DateTime? LastExecutedAt { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
