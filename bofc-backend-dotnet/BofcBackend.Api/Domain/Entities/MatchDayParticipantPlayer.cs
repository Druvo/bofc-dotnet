namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// Port of entity/MatchDayParticipantPlayer.java — a denormalized, read-only
/// (Hibernate @Immutable) flattened view of MatchDay participants. Composite key
/// (MatchDayId, PlayerId) matches Java's @IdClass(MatchDayParticipantId). Not
/// audited (no AuditBase in Java) and never written to by application code — Phase 3
/// services must only query it, never Add/Update/Remove.
/// </summary>
public class MatchDayParticipantPlayer
{
    public long MatchDayId { get; set; }
    public string? MatchDayName { get; set; }
    public DateTime? MatchDayDate { get; set; }

    public long PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public string? PlayerEmployeeId { get; set; }
    public string? PhotoKey { get; set; }

    public string? Comments { get; set; }
    public bool? ParticipationStatus { get; set; }
    public long? MatchDayParticipantId { get; set; }
}
