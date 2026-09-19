using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of service/account/AccountReportService.java - read-only ledger reports.</summary>
public class AccountReportService(BofcDbContext db, AcChartService acChartService)
{
    /// <summary>
    /// Income and Liability accounts are credit-normal - their natural, positive balance is
    /// Cr − Dr, the opposite of debit-normal accounts (Asset, Expense). Reporting Dr − Cr
    /// unconditionally for every account type made Income accounts display as negative
    /// (rendered in red as if something were wrong) even when the club took in real money.
    /// </summary>
    private static bool IsCreditNormal(AcNatureType type) => type is AcNatureType.INCOME or AcNatureType.LIABILITY;

    private static decimal NaturalBalance(AcNatureType type, decimal totalDebit, decimal totalCredit) =>
        IsCreditNormal(type) ? totalCredit - totalDebit : totalDebit - totalCredit;

    public async Task<List<AccountsReport>> GetAccountsReportAsync()
    {
        var rows = await db.AcVoucherDetails
            .GroupBy(v => new { v.AcChart.Nature.Type, v.AcChart.Id, v.AcChart.Code, v.AcChart.Name })
            .Select(g => new
            {
                g.Key.Type,
                g.Key.Id,
                g.Key.Code,
                g.Key.Name,
                TotalDebit = g.Sum(v => v.Dr ?? 0),
                TotalCredit = g.Sum(v => v.Cr ?? 0),
            })
            .ToListAsync();

        return rows.Select(r => new AccountsReport
        {
            AccountType = r.Type,
            AccountId = r.Id,
            AccountCode = r.Code,
            AccountName = r.Name,
            TotalDebit = r.TotalDebit,
            TotalCredit = r.TotalCredit,
            Balance = NaturalBalance(r.Type, r.TotalDebit, r.TotalCredit),
        }).ToList();
    }

    public async Task<List<AccountBalanceSummary>> GetAccountBalancesSummaryAsync()
    {
        var rows = await db.AcVoucherDetails
            .GroupBy(v => new { v.AcChart.Nature.Name, v.AcChart.Nature.Type })
            .Select(g => new
            {
                g.Key.Name,
                g.Key.Type,
                TotalDebit = g.Sum(v => v.Dr ?? 0),
                TotalCredit = g.Sum(v => v.Cr ?? 0),
            })
            .ToListAsync();

        return rows.Select(r => new AccountBalanceSummary
        {
            AccountType = r.Name,
            TotalDebit = r.TotalDebit,
            TotalCredit = r.TotalCredit,
            NetBalance = NaturalBalance(r.Type, r.TotalDebit, r.TotalCredit),
        }).ToList();
    }

    public async Task<List<NatureWiseBalanceSheetReport>> GetBalanceSheetReportAsync()
    {
        var rows = await db.AcVoucherDetails
            .GroupBy(v => v.AcChart.Nature.Type)
            .Select(g => new
            {
                Type = g.Key,
                TotalDebit = g.Sum(v => v.Dr ?? 0),
                TotalCredit = g.Sum(v => v.Cr ?? 0),
            })
            .ToListAsync();

        return rows.Select(r => new NatureWiseBalanceSheetReport
        {
            NatureType = r.Type,
            TotalDebit = r.TotalDebit,
            TotalCredit = r.TotalCredit,
            Balance = NaturalBalance(r.Type, r.TotalDebit, r.TotalCredit),
        }).ToList();
    }

    /// <summary>Cash chart's own Dr − Cr - see GetAccountSummaryAsync's remarks; same reasoning applies here.</summary>
    public async Task<decimal> GetCurrentBalanceAsync()
    {
        var cashChart = await acChartService.GetCashChartAsync();
        var totalDebits = await db.AcVoucherDetails.Where(v => v.AcChartId == cashChart.Id).SumAsync(v => v.Dr ?? 0);
        var totalCredits = await db.AcVoucherDetails.Where(v => v.AcChartId == cashChart.Id).SumAsync(v => v.Cr ?? 0);
        return totalDebits - totalCredits;
    }

    /// <summary>
    /// Tracks the designated cash chart's own Dr/Cr - not "every Asset-nature Dr minus every
    /// Expense-nature Dr". That older calculation only produced the right number by coincidence
    /// (cash happened to be the only asset account anyone posted to); it would silently drift the
    /// moment a second asset account (equipment, receivables) or a liability account got any
    /// activity. Reading the cash chart's own ledger balance is correct by construction: every
    /// collection debits it, every bill payment credits it, so Dr − Cr on that one chart *is* the
    /// club's actual cash position, regardless of what else exists in the chart of accounts.
    /// </summary>
    public async Task<AccountSummaryResponse> GetAccountSummaryAsync()
    {
        var cashChart = await acChartService.GetCashChartAsync();

        var totalCollection = await db.AcVoucherDetails
            .Where(v => v.AcChartId == cashChart.Id)
            .SumAsync(v => v.Dr ?? 0);
        var totalExpense = await db.AcVoucherDetails
            .Where(v => v.AcChartId == cashChart.Id)
            .SumAsync(v => v.Cr ?? 0);

        return new AccountSummaryResponse
        {
            TotalCollection = totalCollection,
            TotalExpense = totalExpense,
            CurrentBalance = totalCollection - totalExpense,
        };
    }

    /// <summary>
    /// Scoped to the cash chart only - summing every Cr/Dr in the ledger regardless of which
    /// chart it hit made TotalCollection always exactly equal TotalExpense (double-entry
    /// vouchers balance by construction, so summing the whole ledger nets to zero every time),
    /// so CurrentBalance was always 0.00 for every month regardless of real activity.
    /// </summary>
    public async Task<List<MonthWiseSummary>> GetMonthlyAccountSummaryAsync()
    {
        var cashChart = await acChartService.GetCashChartAsync();

        var rows = await db.AcVoucherDetails
            .Where(v => v.AcChartId == cashChart.Id)
            .GroupBy(v => new { v.Voucher.VoucherDate.Year, v.Voucher.VoucherDate.Month })
            .Select(g => new
            {
                g.Key.Month,
                g.Key.Year,
                TotalCollection = g.Sum(v => v.Dr ?? 0),
                TotalExpense = g.Sum(v => v.Cr ?? 0),
            })
            .OrderBy(r => r.Year).ThenBy(r => r.Month)
            .ToListAsync();

        return rows.Select(r => new MonthWiseSummary
        {
            Month = r.Month,
            Year = r.Year,
            TotalCollection = r.TotalCollection,
            TotalExpense = r.TotalExpense,
            CurrentBalance = r.TotalCollection - r.TotalExpense,
        }).ToList();
    }

    /// <summary>Scoped to the cash chart only - see GetMonthlyAccountSummaryAsync's remarks; same fix.</summary>
    public async Task<List<MonthWiseSummaryResponse>> GetMonthlyIncomeAndExpenseSummaryAsync(int? year)
    {
        var targetYear = year ?? ClubTime.Now.Year;
        var cashChart = await acChartService.GetCashChartAsync();

        var rows = await db.AcVoucherDetails
            .Where(v => v.AcChartId == cashChart.Id && v.Voucher.VoucherDate.Year == targetYear)
            .GroupBy(v => new { v.Voucher.VoucherDate.Year, v.Voucher.VoucherDate.Month })
            .Select(g => new
            {
                g.Key.Month,
                g.Key.Year,
                TotalIncome = g.Sum(v => v.Dr ?? 0),
                TotalExpense = g.Sum(v => v.Cr ?? 0),
            })
            .OrderBy(r => r.Year).ThenBy(r => r.Month)
            .ToListAsync();

        var summaries = new List<MonthWiseSummaryResponse>();
        var closingBalance = 0m;

        foreach (var row in rows)
        {
            var monthName = System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(row.Month);
            monthName = char.ToUpperInvariant(monthName[0]) + monthName[1..].ToLowerInvariant();

            var currentMonthBalance = row.TotalIncome - row.TotalExpense;
            closingBalance += currentMonthBalance;

            summaries.Add(new MonthWiseSummaryResponse
            {
                Month = row.Month,
                MonthName = monthName,
                Year = row.Year,
                TotalIncome = row.TotalIncome,
                TotalExpense = row.TotalExpense,
                CurrentBalance = currentMonthBalance,
                ClosingBalance = closingBalance,
            });
        }

        return summaries;
    }
}
