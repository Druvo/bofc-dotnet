using BofcBackend.Api.Features.MatchDayParticipants.Models;

namespace BofcBackend.Api.Features.MatchDayParticipants;

/// <summary>Port of service/MatchDayParticipantService.java.</summary>
public interface IMatchDayParticipantService
{
    Task SaveOrUpdateMatchDayParticipantAsync(MatchDayParticipantRequest request);
    Task<List<PlayerParticipationResponse>> PlayersToBeSelectedForTeamAsync(long matchDayId);
    Task<List<GoalkeeperStatsResponse>> GoalkeeperStatsResponseAsync(long matchDayId);
    Task<LatestMatchDayWithParticipantsResponse> GetLatestMatchDayWithParticipantsAsync();
    Task<LatestMatchDayWithUserParticipantsResponse?> GetLatestMatchDayWithUserStatusAsync();
}
