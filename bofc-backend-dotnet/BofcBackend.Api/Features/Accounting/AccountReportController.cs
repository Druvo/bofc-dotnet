using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of controller/account/AccountReportController.java.
///
/// The Java original had no @PreAuthorize and this was ported as [AllowAnonymous] on every
/// action to match, which published the club's accounting - account balances, collection
/// summaries, per-player payment metrics - to anonymous callers on the public internet.
/// Faithfulness to the original is not worth that, so the opt-outs are gone and the global
/// fallback policy (Program.cs) now requires a signed-in user. Not role-gated beyond that:
/// the dashboard shows these figures to ordinary members, and the club's own books being
/// visible to the club's own players is the intent.</summary>
[ApiController]
[Route("ac/reports")]
public class AccountReportController(AccountReportService service, AcCollectionService acCollectionService) : ControllerBase
{
    [HttpGet("accounts-summary")]
    public async Task<IActionResult> GetAccountsReport()
    {
        var report = await service.GetAccountsReportAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, report);
    }

    [HttpGet("balance-summary")]
    public async Task<IActionResult> GetAccountBalancesSummary()
    {
        var summary = await service.GetAccountBalancesSummaryAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [HttpGet("balance-sheet")]
    public async Task<IActionResult> GetBalanceSheet()
    {
        var report = await service.GetBalanceSheetReportAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, report);
    }

    [HttpGet("current-balance")]
    public async Task<IActionResult> GetCurrentBalance()
    {
        var currentBalance = await service.GetCurrentBalanceAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, currentBalance);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetAccountSummary()
    {
        var summary = await service.GetAccountSummaryAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [HttpGet("monthly-summary")]
    public async Task<IActionResult> GetMonthlySummary()
    {
        var summary = await service.GetMonthlyAccountSummaryAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [HttpGet("monthly-income-expense-summary")]
    public async Task<IActionResult> GetMonthlyIncomeAndExpenseSummary([FromQuery] int? year)
    {
        var summary = await service.GetMonthlyIncomeAndExpenseSummaryAsync(year);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [HttpGet("player-collection-metrics")]
    public async Task<IActionResult> GetPlayerCollectionMetrics([FromQuery] int? year)
    {
        var metrics = await acCollectionService.GetPlayerCollectionMetricsAsync(year);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, metrics);
    }
}
