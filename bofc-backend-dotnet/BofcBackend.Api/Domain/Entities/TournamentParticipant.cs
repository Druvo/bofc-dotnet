namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/TournamentParticipant.java.</summary>
public class TournamentParticipant : AuditableEntity
{
    public long Id { get; set; }

    public long TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public bool ParticipationStatus { get; set; }
    public string? Comments { get; set; }
}
