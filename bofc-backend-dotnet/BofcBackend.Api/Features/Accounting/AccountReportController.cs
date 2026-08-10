using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of controller/account/AccountReportController.java - no @PreAuthorize in Java, so fully public here too.</summary>
[ApiController]
[Route("ac/reports")]
public class AccountReportController(AccountReportService service, AcCollectionService acCollectionService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("accounts-summary")]
    public async Task<IActionResult> GetAccountsReport()
    {
        var report = await service.GetAccountsReportAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, report);
    }

    [AllowAnonymous]
    [HttpGet("balance-summary")]
    public async Task<IActionResult> GetAccountBalancesSummary()
    {
        var summary = await service.GetAccountBalancesSummaryAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [AllowAnonymous]
    [HttpGet("balance-sheet")]
    public async Task<IActionResult> GetBalanceSheet()
    {
        var report = await service.GetBalanceSheetReportAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, report);
    }

    [AllowAnonymous]
    [HttpGet("current-balance")]
    public async Task<IActionResult> GetCurrentBalance()
    {
        var currentBalance = await service.GetCurrentBalanceAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, currentBalance);
    }

    [AllowAnonymous]
    [HttpGet("summary")]
    public async Task<IActionResult> GetAccountSummary()
    {
        var summary = await service.GetAccountSummaryAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [AllowAnonymous]
    [HttpGet("monthly-summary")]
    public async Task<IActionResult> GetMonthlySummary()
    {
        var summary = await service.GetMonthlyAccountSummaryAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [AllowAnonymous]
    [HttpGet("monthly-income-expense-summary")]
    public async Task<IActionResult> GetMonthlyIncomeAndExpenseSummary([FromQuery] int? year)
    {
        var summary = await service.GetMonthlyIncomeAndExpenseSummaryAsync(year);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, summary);
    }

    [AllowAnonymous]
    [HttpGet("player-collection-metrics")]
    public async Task<IActionResult> GetPlayerCollectionMetrics([FromQuery] int? year)
    {
        var metrics = await acCollectionService.GetPlayerCollectionMetricsAsync(year);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, metrics);
    }
}
