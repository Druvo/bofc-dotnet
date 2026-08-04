using BofcBackend.Api.Features.TournamentParticipants.Models;

namespace BofcBackend.Api.Features.TournamentParticipants;

/// <summary>Port of service/TournamentParticipantPlayerService.java.</summary>
public interface ITournamentParticipantPlayerService
{
    Task<TournamentWithPlayersResponse> GetNextTournamentForParticipationAsync(long tournamentId);
}
