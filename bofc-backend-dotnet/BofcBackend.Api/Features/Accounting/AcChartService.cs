using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>
/// Port of service/account/AcChartServiceImpl.java. The chart-of-accounts table is a small,
/// config-like reference table (not expected to grow into the thousands), so response
/// conversion loads every chart + nature once and resolves the parent chain in memory —
/// avoids either an unbounded EF Include chain or N+1 queries for an arbitrarily deep hierarchy.
/// </summary>
public class AcChartService(BofcDbContext db, AcNatureService acNatureService, IOptions<AccountingOptions> accountingOptions)
{
    /// <summary>The "cash" chart every collection debits and every bill payment credits — resolved from Settings (admin-editable, live) falling back to the Accounting:CashChartCode appsettings default.</summary>
    public async Task<AcChart> GetCashChartAsync() =>
        await GetAcChartByCodeAsync(await ResolveCodeAsync(s => s.CashChartCode, accountingOptions.Value.CashChartCode));

    /// <summary>The income chart credited when a player collection is recorded — resolved the same way as GetCashChartAsync.</summary>
    public async Task<AcChart> GetCollectionIncomeChartAsync() =>
        await GetAcChartByCodeAsync(await ResolveCodeAsync(s => s.CollectionIncomeChartCode, accountingOptions.Value.CollectionIncomeChartCode));

    private async Task<string> ResolveCodeAsync(Func<SystemSettings, string?> selector, string fallback)
    {
        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        var code = settings != null ? selector(settings) : null;
        return string.IsNullOrWhiteSpace(code) ? fallback : code;
    }

    public async Task<List<AcChartResponse>> GetAcChartsAsync()
    {
        var (charts, byId) = await LoadAllAsync();
        return charts.Select(c => ConvertToResponse(c, byId)).ToList();
    }

    public async Task<AcChart> GetAcChartByIdAsync(long id) =>
        await db.AcCharts.Include(c => c.Nature).FirstOrDefaultAsync(c => c.Id == id)
        ?? throw new ResourceNotFoundException(RestErrorMessageDetail.AcChartNotFound, HttpStatusCode.NotFound);

    /// <summary>
    /// Resolves a chart by its business-meaningful Code (e.g. "1001") rather than its surrogate
    /// database Id — used wherever application code needs to reference a specific well-known
    /// account (e.g. "the cash account") without hardcoding an Id that shifts every time the
    /// chart of accounts is reseeded or reordered.
    /// </summary>
    public async Task<AcChart> GetAcChartByCodeAsync(string code) =>
        await db.AcCharts.Include(c => c.Nature).FirstOrDefaultAsync(c => c.Code == code)
        ?? throw new ResourceNotFoundException(
            $"{RestErrorMessageDetail.AcChartNotFound} (configured code: '{code}' — check Accounting:CashChartCode / Accounting:CollectionIncomeChartCode)",
            HttpStatusCode.NotFound);

    public async Task<AcChartResponse> GetAcChartResponseByIdAsync(long id)
    {
        var (_, byId) = await LoadAllAsync();
        var chart = byId.TryGetValue(id, out var found)
            ? found
            : throw new ResourceNotFoundException(RestErrorMessageDetail.AcChartNotFound, HttpStatusCode.NotFound);
        return ConvertToResponse(chart, byId);
    }

    public async Task<long> SaveChartAsync(AcChartRequest request)
    {
        var chart = new AcChart();
        await MapRequestToEntityAsync(request, chart);
        db.AcCharts.Add(chart);
        await db.SaveChangesAsync();
        return chart.Id;
    }

    public async Task<long> UpdateChartAsync(long id, AcChartRequest request)
    {
        var chart = await GetAcChartByIdAsync(id);
        await MapRequestToEntityAsync(request, chart);
        await db.SaveChangesAsync();
        return chart.Id;
    }

    public async Task DeleteChartAsync(long id)
    {
        var chart = await GetAcChartByIdAsync(id);
        if (await db.AcVoucherDetails.AnyAsync(d => d.AcChartId == chart.Id))
        {
            throw new BadRequestException(RestErrorMessageDetail.AcChartHasVoucher, HttpStatusCode.BadRequest);
        }

        db.AcCharts.Remove(chart);
        await db.SaveChangesAsync();
    }

    private async Task<(List<AcChart> All, Dictionary<long, AcChart> ById)> LoadAllAsync()
    {
        var all = await db.AcCharts.Include(c => c.Nature).ToListAsync();
        return (all, all.ToDictionary(c => c.Id));
    }

    private async Task MapRequestToEntityAsync(AcChartRequest request, AcChart chart)
    {
        chart.Name = request.Name!;
        chart.Code = request.Code!;
        chart.Description = request.Description!;
        chart.NatureId = (await acNatureService.GetAcNatureByIdAsync(request.NatureId!.Value)).Id;

        if (request.ParentId != null)
        {
            chart.ParentId = (await GetAcChartByIdAsync(request.ParentId.Value)).Id;
        }
        else
        {
            chart.ParentId = null;
        }
    }

    private static AcChartResponse ConvertToResponse(AcChart entity, IReadOnlyDictionary<long, AcChart> byId)
    {
        var response = new AcChartResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            Code = entity.Code,
            Description = entity.Description,
            NatureNo = entity.Nature.Id,
            Nature = AcNatureService.ConvertToResponse(entity.Nature),
            IsActive = entity.IsActive,
        };

        if (entity.ParentId != null && byId.TryGetValue(entity.ParentId.Value, out var parent))
        {
            response.ParentNo = parent.Id;
            response.Parent = ConvertToResponse(parent, byId);
        }

        return response;
    }
}
