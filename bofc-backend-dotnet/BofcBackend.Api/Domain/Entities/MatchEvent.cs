using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/MatchEvent.java.</summary>
public class MatchEvent : AuditableEntity
{
    public long Id { get; set; }

    public long MatchId { get; set; }
    public Match Match { get; set; } = null!;

    public MatchEventType EventType { get; set; }

    public long? PlayerId { get; set; }
    public Player? Player { get; set; }

    public long? TeamId { get; set; }
    public Team? Team { get; set; }

    public int EventTime { get; set; }
    public string? Description { get; set; }

    /// <summary>E.g. the assist provider for a GOAL event.</summary>
    public long? RelatedPlayerId { get; set; }
    public Player? RelatedPlayer { get; set; }

    public string? Details { get; set; }
}
