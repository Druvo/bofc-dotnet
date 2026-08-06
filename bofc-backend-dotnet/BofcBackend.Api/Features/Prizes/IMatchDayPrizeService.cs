using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Prizes.Models;

namespace BofcBackend.Api.Features.Prizes;

public interface IMatchDayPrizeService
{
    Task<MatchDayPrizeResponse> CreatePrizeAsync(MatchDayPrizeRequest request);
    Task<MatchDayPrizeResponse> UpdatePrizeAsync(long prizeId, MatchDayPrizeRequest request);
    Task DeletePrizeAsync(long prizeId);
    Task<MatchDayPrizeResponse> GetPrizeByIdAsync(long prizeId);
    Task<List<MatchDayPrizeResponse>> GetAllPrizesByMatchDayAsync(long matchDayId);
    Task<List<MatchDayPrizeResponse>> GetPrizesByMatchDayAndTypeAsync(long matchDayId, PrizeType prizeType);
    Task<List<MatchDayPrizeResponse>> GetPrizesByTeamAsync(long matchDayId, long teamId);
    Task<List<MatchDayPrizeResponse>> GetPrizesByPlayerAsync(long matchDayId, long playerId);
}
