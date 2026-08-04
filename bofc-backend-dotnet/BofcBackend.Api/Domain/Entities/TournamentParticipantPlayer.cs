namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// Port of entity/TournamentParticipantPlayer.java — a denormalized, read-only
/// (Hibernate @Immutable) flattened view of tournament participants. Composite key
/// (TournamentId, PlayerId) matches Java's @IdClass(TournamentParticipantId). Not
/// audited (no AuditBase in Java) and never written to by application code — Phase 3
/// services must only query it, never Add/Update/Remove.
/// </summary>
public class TournamentParticipantPlayer
{
    public long TournamentId { get; set; }
    public string? TournamentName { get; set; }
    public DateTime? TournamentDate { get; set; }

    public long PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public string? PlayerEmployeeId { get; set; }
    public string? PhotoKey { get; set; }

    public string? Comments { get; set; }
    public bool? ParticipationStatus { get; set; }
    public long? TournamentParticipantId { get; set; }
}
