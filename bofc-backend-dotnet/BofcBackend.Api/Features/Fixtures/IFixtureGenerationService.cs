using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Fixtures.Models;

namespace BofcBackend.Api.Features.Fixtures;

/// <summary>Port of service/FixtureGenerationService.java — the legacy auto-fixture generator.</summary>
public interface IFixtureGenerationService
{
    Task<List<Match>> GenerateFixturesAsync(long matchDayId, FixtureGenerationRequest request);
    Task ClearFixturesAsync(long matchDayId);
    Task<Match> UpdateMatchFixtureAsync(long matchId, MatchFixtureUpdateRequest request);
}
