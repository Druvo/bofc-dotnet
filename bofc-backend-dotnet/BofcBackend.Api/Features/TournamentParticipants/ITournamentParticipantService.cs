using BofcBackend.Api.Features.TournamentParticipants.Models;

namespace BofcBackend.Api.Features.TournamentParticipants;

/// <summary>Port of service/TournamentParticipantService.java.</summary>
public interface ITournamentParticipantService
{
    Task SaveOrUpdateTournamentParticipantAsync(TournamentParticipantRequest request);
    Task<List<PlayerParticipationResponse>> PlayersToBeSelectedForTeamAsync(long tournamentId);
    Task<List<GoalkeeperStatsResponse>> GoalkeeperStatsResponseAsync(long tournamentId);
    Task<LatestTournamentWithParticipantsResponse> GetLatestTournamentWithParticipantsAsync();
    Task<LatestTournamentWithUserParticipantsResponse?> GetLatestTournamentWithUserStatusAsync();
}
