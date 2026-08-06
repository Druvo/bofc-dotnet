namespace BofcBackend.Api.Features.Fixtures.Models;

/// <summary>Port of model/MatchFixtureUpdateRequest.java.</summary>
public class MatchFixtureUpdateRequest
{
    public DateTime? MatchDate { get; set; }
    public long? VenueId { get; set; }

    /// <summary>Which of the club's 2 physical jerseys each side wears — set/changed per match, independent of date/venue.</summary>
    public string? HomeJerseyColor { get; set; }
    public string? AwayJerseyColor { get; set; }
}
