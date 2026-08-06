using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class MatchDayParticipantRequest
{
    public long? MatchDayParticipantId { get; set; }

    [Required(ErrorMessage = "Match Schedule ID is mandatory")]
    public long? MatchDayId { get; set; }

    [Required(ErrorMessage = "Player ID is mandatory")]
    public long? PlayerId { get; set; }

    public string? Comments { get; set; }
    public bool ParticipationStatus { get; set; }
}
