using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Matches.Models;

public class MatchEventRequest
{
    [Required(ErrorMessage = "Match ID is mandatory")]
    public long? MatchId { get; set; }

    [Required(ErrorMessage = "Event type is mandatory")]
    public MatchEventType? EventType { get; set; }

    [Required(ErrorMessage = "Player ID is mandatory")]
    public long? PlayerId { get; set; }

    [Required(ErrorMessage = "Team ID is mandatory")]
    public long? TeamId { get; set; }

    [Required(ErrorMessage = "Event time is mandatory")]
    [Range(0, int.MaxValue, ErrorMessage = "Event time must be zero or positive")]
    public int? EventTime { get; set; }

    public string? Description { get; set; }
    public long? RelatedPlayerId { get; set; }
    public string? Details { get; set; }
}
