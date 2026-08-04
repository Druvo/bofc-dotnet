using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Matches.Models;

public class MatchEventUpdateRequest
{
    [Required(ErrorMessage = "Event time is mandatory")]
    [Range(0, int.MaxValue, ErrorMessage = "Event time must be zero or positive")]
    public int? EventTime { get; set; }

    public string? Description { get; set; }
    public string? Details { get; set; }
}
