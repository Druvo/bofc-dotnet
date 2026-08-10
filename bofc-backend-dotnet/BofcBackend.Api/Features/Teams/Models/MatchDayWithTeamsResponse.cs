using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>
/// Port of the MatchDayResponse shape as built by TeamManagementServiceImpl.getMatchDaysSummery -
/// same fields as Features.MatchDays.Models.MatchDayResponse plus the nested team/player list, kept
/// as its own type here since the two builders populate a different field subset in Java.
/// </summary>
public class MatchDayWithTeamsResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Season { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? RoadmapImageUrl { get; set; }
    public DateTime MatchDayDate { get; set; }
    public int? DurationMinutes { get; set; }
    public string? VenueName { get; set; }
    public string? VenueMapLink { get; set; }
    public bool ActiveStatus { get; set; }
    public bool IsWeeklyMatchDay { get; set; }
    public List<MatchDayTeamResponse> Teams { get; set; } = [];
}
