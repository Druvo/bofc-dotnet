using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Fixtures.Models;

/// <summary>
/// Port of model/FixtureGenerationRequest.java. Several fields (StartDate/MatchesPerDay/DaysRest/
/// MaxTeamsPerGroup/CustomMatchPairings) are dead in Java's FixtureGenerationServiceImpl — never
/// read by generateFixtures, only TeamIds/MatchDates/TimeGapMinutes/MatchDurationMinutes/VenueId
/// are used. Kept here anyway for wire-shape parity with anything the frontend might still send.
/// </summary>
public class FixtureGenerationRequest
{
    [Required(ErrorMessage = "Tournament ID is mandatory")]
    public long? TournamentId { get; set; }

    public List<long>? TeamIds { get; set; }
    public List<DateTime>? MatchDates { get; set; }
    public int? TimeGapMinutes { get; set; }
    public int? MatchDurationMinutes { get; set; }

    public DateTime? StartDate { get; set; }
    public int? MatchesPerDay { get; set; }
    public int? DaysRest { get; set; }
    public long? VenueId { get; set; }
    public int? MaxTeamsPerGroup { get; set; }
    public List<CustomMatchPairing>? CustomMatchPairings { get; set; }

    public class CustomMatchPairing
    {
        public long? HomeTeamId { get; set; }
        public long? AwayTeamId { get; set; }
        public int? Round { get; set; }
        public string? GroupName { get; set; }
    }
}
