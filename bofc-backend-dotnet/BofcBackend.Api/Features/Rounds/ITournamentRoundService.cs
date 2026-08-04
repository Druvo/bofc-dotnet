using BofcBackend.Api.Features.Matches.Models;
using BofcBackend.Api.Features.Rounds.Models;

namespace BofcBackend.Api.Features.Rounds;

/// <summary>Port of service/TournamentRoundService.java.</summary>
public interface ITournamentRoundService
{
    Task<TournamentRoundResponse> CreateRoundAsync(TournamentRoundRequest request);
    Task<TournamentRoundResponse> UpdateRoundAsync(long roundId, TournamentRoundRequest request);
    Task DeleteRoundAsync(long roundId);
    Task<TournamentRoundResponse> GetRoundByIdAsync(long roundId);
    Task<List<TournamentRoundResponse>> GetRoundsByTournamentIdAsync(long tournamentId);
    Task<TournamentStructureResponse> GetTournamentStructureAsync(long tournamentId);
    Task<AdvancedTeamsResponse?> CompleteRoundAsync(RoundCompletionRequest request);
    Task<TournamentRoundResponse> StartRoundAsync(long roundId);
    Task<TournamentRoundResponse?> GetNextRoundAsync(long tournamentId, int currentSequenceOrder);
    Task<TournamentRoundResponse?> GetPreviousRoundAsync(long tournamentId, int currentSequenceOrder);
    Task AssignTeamsToRoundAsync(long roundId, TeamAssignmentRequest request);
    Task RemoveTeamFromRoundAsync(long roundId, long teamId);
    Task<List<MatchResponse>> GenerateRoundMatchesAsync(long roundId, RoundMatchGenerationRequest request);

    /// <summary>Called by MatchManagementService lifecycle transitions once a round's matches all finish.</summary>
    Task CheckAndAutoCompleteRoundAsync(long roundId);
}
