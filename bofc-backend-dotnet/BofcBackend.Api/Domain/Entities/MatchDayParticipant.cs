namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/MatchDayParticipant.java.</summary>
public class MatchDayParticipant : AuditableEntity
{
    public long Id { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public bool ParticipationStatus { get; set; }
    public string? Comments { get; set; }
}
