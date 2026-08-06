namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class PlayerParticipationResponse
{
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public bool? ParticipationStatus { get; set; }
    public string? Comments { get; set; }
    public long? MatchDayParticipantId { get; set; }
    public string? PhotoKey { get; set; }
    public string? PhotoUrl { get; set; }
}
