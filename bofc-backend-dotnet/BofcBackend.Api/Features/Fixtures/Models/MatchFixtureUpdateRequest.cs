namespace BofcBackend.Api.Features.Fixtures.Models;

/// <summary>Port of model/MatchFixtureUpdateRequest.java.</summary>
public class MatchFixtureUpdateRequest
{
    public DateTime? MatchDate { get; set; }
    public long? VenueId { get; set; }
}
