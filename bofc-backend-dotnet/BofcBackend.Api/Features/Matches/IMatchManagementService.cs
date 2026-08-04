using BofcBackend.Api.Features.Matches.Models;

namespace BofcBackend.Api.Features.Matches;

/// <summary>Port of service/MatchManagementService.java.</summary>
public interface IMatchManagementService
{
    Task<MatchResponse> GetMatchByIdAsync(long matchId);
    Task<MatchResponse> StartMatchAsync(long matchId);
    Task<MatchResponse> PauseMatchAsync(long matchId);
    Task<MatchResponse> ResumeMatchAsync(long matchId);
    Task<MatchResponse> CompleteMatchAsync(long matchId);
    Task<MatchResponse> UpdateMatchAsync(long matchId, MatchUpdateRequest request);
    Task<MatchEventResponse> RecordMatchEventAsync(MatchEventRequest request);
    Task<MatchEventResponse> UpdateMatchEventAsync(long eventId, MatchEventUpdateRequest request);
    Task<List<MatchEventResponse>> GetMatchEventsAsync(long matchId);
    Task UpdateElapsedTimeAsync(long matchId, int elapsedSeconds);
    Task UpdateTeamScoreAsync(long matchId, long teamId, int newScore);
    Task DeleteMatchEventAsync(long eventId);
    Task<MatchResponse> CreateMatchAsync(MatchCreateRequest request);
    Task DeleteMatchAsync(long matchId);
    Task UpdateMatchOrderAsync(MatchOrderUpdateRequest request);
}
