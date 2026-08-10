using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.LogicNodes.Models;

/// <summary>Port of model/LogicNodeRequest.java.</summary>
public class LogicNodeRequest
{
    [Required(ErrorMessage = "MatchDay ID is required")]
    public long? MatchDayId { get; set; }

    [Required(ErrorMessage = "Node name is required")]
    public string? NodeName { get; set; }

    /// <summary>ADVANCEMENT, FILTER, CUSTOM.</summary>
    [Required(ErrorMessage = "Node type is required")]
    public string? NodeType { get; set; }

    /// <summary>Nullable - can be from group instead.</summary>
    public long? SourceRoundId { get; set; }

    /// <summary>Nullable - can be from round instead.</summary>
    public long? SourceGroupId { get; set; }

    [Required(ErrorMessage = "Target round ID is required")]
    public long? TargetRoundId { get; set; }

    /// <summary>JSON configuration for the rule, e.g. {"type": "TOP_N_FROM_EACH", "topN": 2, "tieBreakerRules": {...}}.</summary>
    public string? RuleConfig { get; set; }

    public int? PriorityOrder { get; set; }

    public bool? IsActive { get; set; }

    public bool? AutoExecute { get; set; }
}
