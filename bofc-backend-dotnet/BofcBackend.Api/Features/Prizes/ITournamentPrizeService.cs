using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Prizes.Models;

namespace BofcBackend.Api.Features.Prizes;

public interface ITournamentPrizeService
{
    Task<TournamentPrizeResponse> CreatePrizeAsync(TournamentPrizeRequest request);
    Task<TournamentPrizeResponse> UpdatePrizeAsync(long prizeId, TournamentPrizeRequest request);
    Task DeletePrizeAsync(long prizeId);
    Task<TournamentPrizeResponse> GetPrizeByIdAsync(long prizeId);
    Task<List<TournamentPrizeResponse>> GetAllPrizesByTournamentAsync(long tournamentId);
    Task<List<TournamentPrizeResponse>> GetPrizesByTournamentAndTypeAsync(long tournamentId, PrizeType prizeType);
    Task<List<TournamentPrizeResponse>> GetPrizesByTeamAsync(long tournamentId, long teamId);
    Task<List<TournamentPrizeResponse>> GetPrizesByPlayerAsync(long tournamentId, long playerId);
}
