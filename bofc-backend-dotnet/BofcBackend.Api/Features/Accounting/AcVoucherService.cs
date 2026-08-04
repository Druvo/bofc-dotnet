using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using BofcBackend.Api.Features.Players;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>
/// Port of service/account/AcVoucherService.java. Java has AcVoucherService &lt;-&gt;
/// AcBillPaymentService &lt;-&gt; AcCollectionService as a circular @Lazy-injected dependency
/// triangle (Spring tolerates it via lazy proxies; .NET's DI container does not support
/// constructor-cycle dependencies at all). Flattened per the migration plan: this service
/// builds the nested BillPayment/Collection response DTOs itself, inline, duplicating the small
/// conversion logic that also lives in AcBillPaymentService/AcCollectionService — rather than
/// calling back into those services — so the dependency graph is one-directional
/// (AcBillPaymentService/AcCollectionService -&gt; AcVoucherService, never the reverse).
/// </summary>
public class AcVoucherService(
    BofcDbContext db,
    AcChartService acChartService,
    AcVoucherTypeService acVoucherTypeService,
    CostTypeService costTypeService,
    IPlayerService playerService,
    ICurrentUserService currentUserService)
{
    public async Task<List<AcVoucherResponse>> GetAllAcVouchersAsync(bool? isDetailsResponse)
    {
        var vouchers = await LoadVouchersQuery()
            .OrderByDescending(v => v.Id)
            .Take(PaginationDefaults.MaxListSize)
            .ToListAsync();

        var responses = new List<AcVoucherResponse>();
        foreach (var voucher in vouchers)
        {
            responses.Add(await BuildResponseAsync(voucher, isDetailsResponse));
        }

        return responses;
    }

    public async Task<AcVoucherResponse> GetAcVoucherResponseAsync(long id, bool? isDetailsResponse) =>
        await BuildResponseAsync(await GetAcVoucherAsync(id), isDetailsResponse);

    public async Task<AcVoucher> GetAcVoucherAsync(long id) =>
        await LoadVouchersQuery().FirstOrDefaultAsync(v => v.Id == id)
        ?? throw new ResourceNotFoundException(RestErrorMessageDetail.AcVoucherNotFound, HttpStatusCode.NotFound);

    public async Task<long> SaveVoucherAsync(AcVoucherRequest request)
    {
        var crSum = CalculateSum(request.Details, d => d.Cr);
        var drSum = CalculateSum(request.Details, d => d.Dr);

        if (drSum != crSum)
        {
            throw new BadRequestException(RestErrorMessageDetail.AcVoucherDrCrAmountNotSame, HttpStatusCode.BadRequest);
        }

        var voucher = await BuildAcVoucherFromRequestAsync(request, crSum);
        voucher.Details = await BuildVoucherDetailsAsync(request, voucher);

        db.AcVouchers.Add(voucher);
        await db.SaveChangesAsync();
        return voucher.Id;
    }

    public async Task<long> UpdateVoucherAsync(long id, AcVoucherRequest request)
    {
        var existingVoucher = await db.AcVouchers.Include(v => v.Details).FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new ResourceNotFoundException(RestErrorMessageDetail.AcVoucherNotFound, HttpStatusCode.NotFound);

        var crSum = CalculateSum(request.Details, d => d.Cr);
        var drSum = CalculateSum(request.Details, d => d.Dr);

        if (drSum != crSum)
        {
            throw new BadRequestException(RestErrorMessageDetail.AcVoucherDrCrAmountNotSame, HttpStatusCode.BadRequest);
        }

        existingVoucher.VoucherDate = request.VoucherDate!.Value;
        existingVoucher.Narration = request.Narration;
        existingVoucher.Amount = crSum;
        existingVoucher.CollectionId = request.CollectionId;
        existingVoucher.BillPaymentId = request.BillPaymentId;

        if (request.PostFlag && !existingVoucher.PostFlag)
        {
            existingVoucher.PostedById = currentUserService.GetPlayerId();
            existingVoucher.PostDate = DateTime.Now;
            existingVoucher.PostFlag = true;
        }

        existingVoucher.Details.Clear();
        foreach (var detail in await BuildVoucherDetailsAsync(request, existingVoucher))
        {
            existingVoucher.Details.Add(detail);
        }

        await db.SaveChangesAsync();
        return existingVoucher.Id;
    }

    public async Task DeleteVoucherAsync(long id)
    {
        var voucher = await GetAcVoucherAsync(id);
        db.AcVouchers.Remove(voucher);
        await db.SaveChangesAsync();
    }

    private IQueryable<AcVoucher> LoadVouchersQuery() => db.AcVouchers
        .Include(v => v.VoucherType)
        .Include(v => v.PostedBy).ThenInclude(p => p!.Roles)
        .Include(v => v.Details)
        .Include(v => v.Collection).ThenInclude(c => c!.Players)
        .Include(v => v.BillPayment).ThenInclude(p => p!.CostType);

    private async Task<AcVoucherResponse> BuildResponseAsync(AcVoucher voucher, bool? isDetailsResponse)
    {
        var response = new AcVoucherResponse
        {
            Id = voucher.Id,
            Amount = voucher.Amount,
            Narration = voucher.Narration,
            Code = voucher.Code,
            VoucherDate = voucher.VoucherDate,
            VoucherType = AcVoucherTypeService.ConvertToResponse(voucher.VoucherType),
            PostDate = voucher.PostDate,
            PostFlag = voucher.PostFlag,
        };

        if (voucher.Collection != null)
        {
            response.Collection = ConvertCollectionToResponse(voucher.Collection);
        }

        if (voucher.PostedBy != null)
        {
            response.PostedBy = playerService.GetPlayerResponse(voucher.PostedBy);
        }

        if (voucher.BillPayment != null)
        {
            response.BillPayment = ConvertBillPaymentToResponse(voucher.BillPayment);
        }

        if (isDetailsResponse == true)
        {
            var details = new List<AcVoucherDetailResponse>();
            foreach (var detail in voucher.Details)
            {
                details.Add(await ConvertDetailToResponseAsync(detail));
            }

            response.Details = details;
        }

        return response;
    }

    /// <summary>Duplicates AcCollectionServiceImpl.convertToPaymentResponse's shape (voucher/code omitted — caller already has them).</summary>
    private AcCollectionResponse ConvertCollectionToResponse(AcCollection collection)
    {
        var playerResponses = playerService.GetPlayerResponses(collection.Players).ToList();
        return new AcCollectionResponse
        {
            Id = collection.Id,
            TransactionId = collection.TransactionId,
            Date = collection.Date,
            MonthOfPayment = collection.MonthOfPayment,
            Amount = collection.Amount,
            TotalAmount = collection.TotalAmount,
            Players = playerResponses,
            AllPayersName = string.Join(", ", collection.Players.Select(p => p.Name)),
            PlayerIds = collection.Players.Select(p => p.Id).ToHashSet(),
            CreatedDate = collection.CreatedDate,
            UpdatedDate = collection.UpdatedDate,
        };
    }

    /// <summary>Duplicates AcBillPaymentServiceImpl.convertBillPaymentDto's shape (voucher/code omitted — caller already has them).</summary>
    private AcBillPaymentResponse ConvertBillPaymentToResponse(AcBillPayment billPayment) => new()
    {
        Id = billPayment.Id,
        Code = billPayment.Code,
        PaymentDate = billPayment.PaymentDate,
        Amount = billPayment.Amount,
        Description = billPayment.Description,
        CostType = costTypeService.GetByCostType(billPayment.CostType),
    };

    private async Task<AcVoucherDetailResponse> ConvertDetailToResponseAsync(AcVoucherDetail detail) => new()
    {
        Id = detail.Id,
        Cr = detail.Cr,
        Dr = detail.Dr,
        AcChart = await acChartService.GetAcChartResponseByIdAsync(detail.AcChartId),
        Narration = detail.Narration,
        ReferenceNo = detail.ReferenceNo,
    };

    private static decimal CalculateSum(List<AcVoucherDetailRequest> details, Func<AcVoucherDetailRequest, decimal?> getter) =>
        details.Select(getter).Where(v => v != null).Sum(v => v!.Value);

    private async Task<List<AcVoucherDetail>> BuildVoucherDetailsAsync(AcVoucherRequest request, AcVoucher voucher)
    {
        var result = new List<AcVoucherDetail>();
        foreach (var detailRequest in request.Details)
        {
            var chart = await acChartService.GetAcChartByIdAsync(detailRequest.AcChartId!.Value);
            result.Add(new AcVoucherDetail
            {
                Cr = detailRequest.Cr,
                Dr = detailRequest.Dr,
                Narration = detailRequest.Narration,
                AcChartId = chart.Id,
                ReferenceNo = detailRequest.ReferenceNo,
                Voucher = voucher,
            });
        }

        return result;
    }

    private async Task<AcVoucher> BuildAcVoucherFromRequestAsync(AcVoucherRequest request, decimal amount)
    {
        var voucherType = await acVoucherTypeService.GetAcVoucherTypeByIdAsync(request.VoucherTypeId!.Value);

        var voucher = new AcVoucher
        {
            VoucherDate = request.VoucherDate!.Value,
            VoucherTypeId = voucherType.Id,
            Code = await GenerateUniqueCodeAsync(voucherType),
            Narration = request.Narration,
            Amount = amount,
            CollectionId = request.CollectionId,
            BillPaymentId = request.BillPaymentId,
        };

        if (request.PostFlag)
        {
            voucher.PostedById = currentUserService.GetPlayerId();
            voucher.PostDate = DateTime.Now;
            voucher.PostFlag = true;
        }

        return voucher;
    }

    private async Task<string> GenerateUniqueCodeAsync(AcVoucherType voucherType)
    {
        string code;
        do
        {
            code = $"{voucherType.Alias}{DateTime.Now.Year}{RandomUtil.GenerateRandomString(4)}";
        }
        while (await db.AcVouchers.AnyAsync(v => v.Code == code));

        return code;
    }
}
