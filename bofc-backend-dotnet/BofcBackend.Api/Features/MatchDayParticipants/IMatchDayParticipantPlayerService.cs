using BofcBackend.Api.Features.MatchDayParticipants.Models;

namespace BofcBackend.Api.Features.MatchDayParticipants;

/// <summary>Port of service/MatchDayParticipantPlayerService.java.</summary>
public interface IMatchDayParticipantPlayerService
{
    Task<MatchDayWithPlayersResponse> GetNextMatchDayForParticipationAsync(long matchDayId);
}
