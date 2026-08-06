namespace BofcBackend.Api.Features.MatchDays.Models;

public class MatchDayListResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Format: dd-MM-yyyy (e.g., "25-12-2025").</summary>
    public string? MatchDayDate { get; set; }
}
