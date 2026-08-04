using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/RoundTeam.java.</summary>
public class RoundTeam : AuditableEntity
{
    public long Id { get; set; }

    public long RoundId { get; set; }
    public TournamentRound Round { get; set; } = null!;

    public long? TeamId { get; set; }
    public Team? Team { get; set; }

    public TeamAssignmentType AssignmentType { get; set; }
    public string? SourceRule { get; set; }
    public bool IsPlaceholder { get; set; }
    public string? PlaceholderName { get; set; }
    public int? SeedPosition { get; set; }
    public DateTime? AssignedAt { get; set; }
}
