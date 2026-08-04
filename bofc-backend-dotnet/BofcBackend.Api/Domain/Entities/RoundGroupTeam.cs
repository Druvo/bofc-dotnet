using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/RoundGroupTeam.java.</summary>
public class RoundGroupTeam : AuditableEntity
{
    public long Id { get; set; }

    public long GroupId { get; set; }
    public RoundGroup Group { get; set; } = null!;

    public long? TeamId { get; set; }
    public Team? Team { get; set; }

    public TeamAssignmentType AssignmentType { get; set; }
    public string? SourceRule { get; set; }
    public bool IsPlaceholder { get; set; }
    public string? PlaceholderName { get; set; }
    public DateTime? AssignedAt { get; set; }
}
