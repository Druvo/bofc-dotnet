using BofcBackend.Api.Features.Matches.Models;
using BofcBackend.Api.Features.Rounds.Models;

namespace BofcBackend.Api.Features.Rounds;

/// <summary>Port of service/MatchDayRoundService.java.</summary>
public interface IMatchDayRoundService
{
    Task<MatchDayRoundResponse> CreateRoundAsync(MatchDayRoundRequest request);
    Task<MatchDayRoundResponse> UpdateRoundAsync(long roundId, MatchDayRoundRequest request);
    Task DeleteRoundAsync(long roundId);
    Task<MatchDayRoundResponse> GetRoundByIdAsync(long roundId);
    Task<List<MatchDayRoundResponse>> GetRoundsByMatchDayIdAsync(long matchDayId);
    Task<MatchDayStructureResponse> GetMatchDayStructureAsync(long matchDayId);
    Task<AdvancedTeamsResponse?> CompleteRoundAsync(RoundCompletionRequest request);
    Task<MatchDayRoundResponse> StartRoundAsync(long roundId);
    Task<MatchDayRoundResponse?> GetNextRoundAsync(long matchDayId, int currentSequenceOrder);
    Task<MatchDayRoundResponse?> GetPreviousRoundAsync(long matchDayId, int currentSequenceOrder);
    Task AssignTeamsToRoundAsync(long roundId, TeamAssignmentRequest request);
    Task RemoveTeamFromRoundAsync(long roundId, long teamId);
    Task<List<MatchResponse>> GenerateRoundMatchesAsync(long roundId, RoundMatchGenerationRequest request);

    /// <summary>Called by MatchManagementService lifecycle transitions once a round's matches all finish.</summary>
    Task CheckAndAutoCompleteRoundAsync(long roundId);
}
