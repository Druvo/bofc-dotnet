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

    /// <summary>Insert a one-time break after this match number (1-based) in the generated
    /// schedule — e.g. 3 means the break falls between match 3 and match 4. Null/0 = no break.</summary>
    public int? BreakAfterMatchNumber { get; set; }

    /// <summary>Length of the one-time break, added on top of the normal gap after
    /// <see cref="BreakAfterMatchNumber"/>. Ignored unless BreakAfterMatchNumber is set.</summary>
    public int? BreakDurationMinutes { get; set; }

    public class CustomMatchPairing
    {
        public long? HomeTeamId { get; set; }
        public long? AwayTeamId { get; set; }
        public int? Round { get; set; }
        public string? GroupName { get; set; }
    }
}
