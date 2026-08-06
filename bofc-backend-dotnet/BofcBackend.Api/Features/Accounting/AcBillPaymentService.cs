using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of service/account/AcBillPaymentService.java.</summary>
public class AcBillPaymentService(
    BofcDbContext db,
    CostTypeService costTypeService,
    AcVoucherService voucherService,
    AcChartService acChartService)
{
    public async Task<List<AcBillPaymentResponse>> GetAllBillPaymentsAsync()
    {
        var billPayments = await LoadQuery()
            .OrderByDescending(p => p.Id)
            .Take(PaginationDefaults.MaxListSize)
            .ToListAsync();
        return billPayments.Select(ConvertBillPaymentToDto).ToList();
    }

    public async Task<SpringPageResponse<AcBillPaymentResponse>> GetPaginatedAcBillPaymentsAsync(
        int page, int size, string? sortBy, string? order, int? year, int? month)
    {
        var query = LoadQuery();

        query = year != null && month != null
            ? query.Where(p => p.PaymentDate.Year == year && p.PaymentDate.Month == month)
            : year != null
                ? query.Where(p => p.PaymentDate.Year == year)
                : query;

        var ascending = string.Equals(order, "ASC", StringComparison.OrdinalIgnoreCase);
        query = (sortBy ?? "paymentDate") switch
        {
            "paymentDate" => ascending ? query.OrderBy(p => p.PaymentDate) : query.OrderByDescending(p => p.PaymentDate),
            "amount" => ascending ? query.OrderBy(p => p.Amount) : query.OrderByDescending(p => p.Amount),
            "code" => ascending ? query.OrderBy(p => p.Code) : query.OrderByDescending(p => p.Code),
            _ => ascending ? query.OrderBy(p => p.PaymentDate) : query.OrderByDescending(p => p.PaymentDate),
        };

        var totalElements = await query.LongCountAsync();
        var pageItems = await query.Skip(page * size).Take(size).ToListAsync();

        return new SpringPageResponse<AcBillPaymentResponse>(
            pageItems.Select(ConvertBillPaymentToDto).ToList(), totalElements, page, size);
    }

    public async Task<long> SaveAsync(AcBillPaymentRequest request)
    {
        var billPayment = await CreateOrUpdateBillPaymentEntityAsync(null, request);

        // Transaction: a bill payment row must never persist without its ledger voucher —
        // if voucher creation fails (e.g. a bad chart-of-account reference), the whole
        // thing rolls back instead of leaving an orphaned, un-vouchered payment.
        await using var transaction = await db.Database.BeginTransactionAsync();

        db.AcBillPayments.Add(billPayment);
        await db.SaveChangesAsync();

        await HandleVoucherForBillPaymentAsync(billPayment, request, null);

        await transaction.CommitAsync();

        return billPayment.Id;
    }

    public async Task<long> UpdateAsync(long id, AcBillPaymentRequest request)
    {
        var existingBillPayment = await CreateOrUpdateBillPaymentEntityAsync(id, request);

        await using var transaction = await db.Database.BeginTransactionAsync();

        await db.SaveChangesAsync();

        await HandleVoucherForBillPaymentAsync(existingBillPayment, request, existingBillPayment.Voucher?.Id);

        await transaction.CommitAsync();

        return existingBillPayment.Id;
    }

    public async Task DeleteAsync(long id)
    {
        var billPayment = await GetAcBillPaymentEntityAsync(id);
        db.AcBillPayments.Remove(billPayment);
        await db.SaveChangesAsync();
    }

    private async Task HandleVoucherForBillPaymentAsync(AcBillPayment billPayment, AcBillPaymentRequest request, long? voucherId)
    {
        var costType = await costTypeService.GetCostTypeEntityAsync(billPayment.CostTypeId);

        // Resolved by Code (Settings, falling back to appsettings), not a hardcoded chart Id — see AcChartService.
        var cashChart = await acChartService.GetCashChartAsync();

        var voucherRequest = new AcVoucherRequest
        {
            BillPaymentId = billPayment.Id,
            VoucherDate = billPayment.PaymentDate,
            VoucherTypeId = 1L,
            Narration = request.Description,
            PostFlag = true,
            Details =
            [
                new AcVoucherDetailRequest { Dr = request.Amount, AcChartId = costType.ChartId },
                new AcVoucherDetailRequest { Cr = request.Amount, AcChartId = cashChart.Id },
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

    private async Task<AcBillPayment> CreateOrUpdateBillPaymentEntityAsync(long? id, AcBillPaymentRequest request)
    {
        var billPayment = id != null ? await GetAcBillPaymentEntityAsync(id.Value) : new AcBillPayment();

        var costType = await costTypeService.GetCostTypeEntityAsync(request.CostTypeId!.Value);

        billPayment.Amount = request.Amount!.Value;
        billPayment.PaymentDate = request.PaymentDate!.Value;
        billPayment.Description = request.Description;
        billPayment.CostTypeId = costType.Id;
        billPayment.PaymentAccountId = await ValidatePaymentAccountIdAsync(request.PaymentAccountId);

        if (id == null)
        {
            billPayment.Code = await GenerateUniqueBillCodeAsync();
        }

        return billPayment;
    }

    public async Task<AcBillPayment> GetAcBillPaymentEntityAsync(long id) =>
        await LoadQuery().FirstOrDefaultAsync(p => p.Id == id)
        ?? throw new ResourceNotFoundException(RestErrorMessageDetail.AcBillPaymentNotFound, HttpStatusCode.NotFound);

    private async Task<string> GenerateUniqueBillCodeAsync()
    {
        string code;
        do
        {
            code = $"BIL{RandomUtil.GenerateRandomString(10)}";
        }
        while (await db.AcBillPayments.AnyAsync(p => p.Code == code));

        return code;
    }

    public AcBillPaymentResponse GetAcBillPaymentResponse(AcBillPayment billPayment) => ConvertBillPaymentToDto(billPayment);

    private IQueryable<AcBillPayment> LoadQuery() => db.AcBillPayments
        .Include(p => p.CostType)
        .Include(p => p.Voucher)
        .Include(p => p.PaymentAccount);

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

    private AcBillPaymentResponse ConvertBillPaymentToDto(AcBillPayment billPayment)
    {
        var response = new AcBillPaymentResponse
        {
            Id = billPayment.Id,
            Code = billPayment.Code,
            PaymentDate = billPayment.PaymentDate,
            Amount = billPayment.Amount,
            Description = billPayment.Description,
            CostType = costTypeService.GetByCostType(billPayment.CostType),
        };

        if (billPayment.Voucher != null)
        {
            response.VoucherId = billPayment.Voucher.Id;
            response.VoucherCode = billPayment.Voucher.Code;
        }

        if (billPayment.PaymentAccount != null)
        {
            response.PaymentAccountId = billPayment.PaymentAccount.Id;
            response.PaymentAccountName = billPayment.PaymentAccount.AccountName;
        }

        return response;
    }
}
