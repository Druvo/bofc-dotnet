using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using BofcBackend.Api.Features.Players;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of service/account/AcCollectionServiceImpl.java.</summary>
public class AcCollectionService(
    BofcDbContext db,
    IPlayerService playerService,
    CostTypeService costTypeService,
    AcVoucherService voucherService,
    AcChartService acChartService,
    IOptions<AccountingOptions> accountingOptions)
{
    public async Task<long> SavePaymentCollectionAsync(PaymentCollectionRequest request)
    {
        var players = await LoadPlayersAsync(request.PlayerIds);
        var paymentAccountId = await ValidatePaymentAccountIdAsync(request.PaymentAccountId);

        var collection = new AcCollection
        {
            TransactionId = await GenerateUniqueTransactionIdAsync(),
            Players = players,
            Amount = request.Amount!.Value,
            TotalAmount = request.Amount.Value * players.Count,
            MonthOfPayment = request.MonthOfPayment!.Value,
            Description = request.Description,
            Date = request.Date!.Value,
            PaymentAccountId = paymentAccountId,
        };

        // Transaction: a collection row must never persist without its ledger voucher —
        // if voucher creation fails (e.g. a bad chart-of-account reference), the whole
        // thing rolls back instead of leaving an orphaned, un-vouchered collection.
        await using var transaction = await db.Database.BeginTransactionAsync();

        db.AcCollections.Add(collection);
        await db.SaveChangesAsync();

        await HandleVoucherForCollectionAsync(request, collection, players, null);

        await transaction.CommitAsync();

        return collection.Id;
    }

    public async Task<long> UpdatePaymentCollectionAsync(long id, PaymentCollectionRequest request)
    {
        var existingCollection = await GetAcCollectionByIdAsync(id);
        var players = await LoadPlayersAsync(request.PlayerIds);

        existingCollection.Players = players;
        existingCollection.Amount = request.Amount!.Value;
        existingCollection.TotalAmount = request.Amount.Value * players.Count;
        existingCollection.MonthOfPayment = request.MonthOfPayment!.Value;
        existingCollection.Description = request.Description;
        existingCollection.Date = request.Date!.Value;
        existingCollection.PaymentAccountId = await ValidatePaymentAccountIdAsync(request.PaymentAccountId);

        await using var transaction = await db.Database.BeginTransactionAsync();

        await db.SaveChangesAsync();

        await HandleVoucherForCollectionAsync(request, existingCollection, players, existingCollection.Voucher?.Id);

        await transaction.CommitAsync();

        return existingCollection.Id;
    }

    public async Task DeletePaymentCollectionAsync(long id)
    {
        var existingCollection = await GetAcCollectionByIdAsync(id);
        db.AcCollections.Remove(existingCollection);
        await db.SaveChangesAsync();
    }

    public async Task<List<AcCollectionResponse>> GetAllAcCollectionsAsync()
    {
        var entities = await LoadQuery()
            .OrderByDescending(c => c.Id)
            .Take(PaginationDefaults.MaxListSize)
            .ToListAsync();
        return entities.Select(ConvertToPaymentResponse).ToList();
    }

    public async Task RecordCostAsync(MonthlyCostRequest request)
    {
        var costType = await costTypeService.GetCostTypeEntityAsync(request.CostTypeId!.Value);

        var cost = new MonthlyCost
        {
            CostTypeId = costType.Id,
            Amount = request.Amount,
            MonthOfCost = request.MonthOfCost!.Value,
            Description = request.Description,
        };

        db.MonthlyCosts.Add(cost);
        await db.SaveChangesAsync();
    }

    private async Task<string> GenerateUniqueTransactionIdAsync()
    {
        string transactionId;
        do
        {
            transactionId = $"COL{RandomUtil.GenerateRandomString(10)}";
        }
        while (await db.AcCollections.AnyAsync(c => c.TransactionId == transactionId));

        return transactionId;
    }

    public async Task<AcCollection> GetAcCollectionByIdAsync(long id) =>
        await LoadQuery().FirstOrDefaultAsync(c => c.Id == id)
        ?? throw new ResourceNotFoundException(RestErrorMessageDetail.AcCollectionNotFound, HttpStatusCode.NotFound);

    public AcCollectionResponse GetAcCollectionResponse(AcCollection acCollection) => ConvertToPaymentResponse(acCollection);

    private IQueryable<AcCollection> LoadQuery() => db.AcCollections
        .Include(c => c.Players)
        .Include(c => c.Voucher)
        .Include(c => c.PaymentAccount);

    private async Task<long?> ValidatePaymentAccountIdAsync(long? paymentAccountId)
    {
        if (paymentAccountId == null)
        {
            return null;
        }

        return await db.PaymentAccounts.AnyAsync(a => a.Id == paymentAccountId.Value)
            ? paymentAccountId
            : throw new ResourceNotFoundException(RestErrorMessageDetail.PaymentAccountNotFound, HttpStatusCode.NotFound);
    }

    private AcCollectionResponse ConvertToPaymentResponse(AcCollection collection)
    {
        var response = new AcCollectionResponse
        {
            Id = collection.Id,
            TransactionId = collection.TransactionId,
            Date = collection.Date,
            MonthOfPayment = collection.MonthOfPayment,
            Amount = collection.Amount,
            TotalAmount = collection.TotalAmount,
            Players = playerService.GetPlayerResponses(collection.Players).ToList(),
            AllPayersName = string.Join(", ", collection.Players.Select(p => p.Name)),
            PlayerIds = collection.Players.Select(p => p.Id).ToHashSet(),
            CreatedDate = collection.CreatedDate,
            UpdatedDate = collection.UpdatedDate,
        };

        if (collection.Voucher != null)
        {
            response.VoucherCode = collection.Voucher.Code;
            response.VoucherId = collection.Voucher.Id;
        }

        if (collection.PaymentAccount != null)
        {
            response.PaymentAccountId = collection.PaymentAccount.Id;
            response.PaymentAccountName = collection.PaymentAccount.AccountName;
        }

        return response;
    }

    private async Task HandleVoucherForCollectionAsync(
        PaymentCollectionRequest request, AcCollection collection, List<Player> players, long? voucherId)
    {
        var totalAmount = request.Amount!.Value * players.Count;

        // Resolved by Code, not a hardcoded chart Id — see AccountingOptions.
        var cashChart = await acChartService.GetAcChartByCodeAsync(accountingOptions.Value.CashChartCode);
        var incomeChart = await acChartService.GetAcChartByCodeAsync(accountingOptions.Value.CollectionIncomeChartCode);

        var voucherRequest = new AcVoucherRequest
        {
            CollectionId = collection.Id,
            VoucherDate = request.Date,
            VoucherTypeId = 2L,
            Narration = request.Description,
            PostFlag = true,
            Details =
            [
                new AcVoucherDetailRequest { Dr = totalAmount, ReferenceNo = "Monthly collection.", AcChartId = cashChart.Id },
                new AcVoucherDetailRequest { Cr = totalAmount, ReferenceNo = "Monthly collection.", AcChartId = incomeChart.Id },
            ],
        };

        if (voucherId != null)
        {
            await voucherService.UpdateVoucherAsync(voucherId.Value, voucherRequest);
        }
        else
        {
            await voucherService.SaveVoucherAsync(voucherRequest);
        }
    }

    private async Task<List<Player>> LoadPlayersAsync(HashSet<long> playerIds)
    {
        var players = new List<Player>();
        foreach (var playerId in playerIds)
        {
            players.Add(await playerService.GetPlayerEntityAsync(playerId));
        }

        return players;
    }

    public async Task<PlayerCollectionMetricsResponse> GetPlayerCollectionMetricsAsync(int? year)
    {
        var collections = year == null
            ? await db.AcCollections.Include(c => c.Players).ToListAsync()
            : await db.AcCollections.Include(c => c.Players).Where(c => c.Date.Year == year).ToListAsync();

        var reportMap = new Dictionary<long, PlayerCollectionReport>();

        // Seed every player first (not just ones who've ever paid) — otherwise
        // a player who has never made a collection is simply absent from this
        // report instead of showing a zero, and any "who hasn't paid this
        // month" check downstream (e.g. UpcomingDuesWidget) can never see them.
        var allPlayers = await db.Players.ToListAsync();
        foreach (var player in allPlayers)
        {
            reportMap[player.Id] = new PlayerCollectionReport
            {
                PlayerId = player.Id,
                PlayerName = player.Name,
                IsActive = player.IsActive,
                YearMonthAmount = [],
            };
        }

        foreach (var collection in collections)
        {
            foreach (var player in collection.Players)
            {
                if (!reportMap.TryGetValue(player.Id, out var report))
                {
                    report = new PlayerCollectionReport
                    {
                        PlayerId = player.Id,
                        PlayerName = player.Name,
                        IsActive = player.IsActive,
                        YearMonthAmount = [],
                    };
                    reportMap[player.Id] = report;
                }

                var yearValue = collection.MonthOfPayment.Year;
                var monthValue = collection.MonthOfPayment.Month;

                if (!report.YearMonthAmount.TryGetValue(yearValue, out var monthMap))
                {
                    monthMap = [];
                    report.YearMonthAmount[yearValue] = monthMap;
                }

                monthMap[monthValue] = monthMap.GetValueOrDefault(monthValue) + collection.Amount;
            }
        }

        var years = await db.AcCollections
            .Select(c => c.Date.Year)
            .Distinct()
            .OrderByDescending(y => y)
            .ToListAsync();

        return new PlayerCollectionMetricsResponse
        {
            Metrics = reportMap.Values.ToList(),
            Years = years,
        };
    }
}
