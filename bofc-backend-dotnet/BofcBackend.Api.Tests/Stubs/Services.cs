using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using BofcBackend.Api.Features.Players.Models;

// Stand-ins for the services AcCollectionService is constructed with. Only the members it calls.
namespace BofcBackend.Api.Features.Players
{
    public interface IPlayerService
    {
        Task<Player> GetPlayerEntityAsync(long id);
        HashSet<PlayerResponse> GetPlayerResponses(IEnumerable<Player> players);
    }

    public class FakePlayerService : IPlayerService
    {
        public Task<Player> GetPlayerEntityAsync(long id) => throw new NotSupportedException();
        public HashSet<PlayerResponse> GetPlayerResponses(IEnumerable<Player> players) =>
            players.Select(p => new PlayerResponse { Id = p.Id, Name = p.Name }).ToHashSet();
    }
}

namespace BofcBackend.Api.Features.Accounting
{
    public class CostTypeService
    {
        public Task<CostType> GetCostTypeEntityAsync(long id) => throw new NotSupportedException();
    }

    public class AcVoucherService
    {
        public Task<long> SaveVoucherAsync(AcVoucherRequest request) => throw new NotSupportedException();
        public Task<long> UpdateVoucherAsync(long id, AcVoucherRequest request) => throw new NotSupportedException();
    }

    public class AcChartService
    {
        public Task<AcChart> GetCashChartAsync() => throw new NotSupportedException();
        public Task<AcChart> GetCollectionIncomeChartAsync() => throw new NotSupportedException();
    }
}
