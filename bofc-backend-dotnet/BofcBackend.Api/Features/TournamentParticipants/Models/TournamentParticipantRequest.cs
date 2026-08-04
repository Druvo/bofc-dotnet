using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.TournamentParticipants.Models;

public class TournamentParticipantRequest
{
    public long? TournamentParticipantId { get; set; }

    [Required(ErrorMessage = "Match Schedule ID is mandatory")]
    public long? TournamentId { get; set; }

    [Required(ErrorMessage = "Player ID is mandatory")]
    public long? PlayerId { get; set; }

    public string? Comments { get; set; }
    public bool ParticipationStatus { get; set; }
}
