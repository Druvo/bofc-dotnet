namespace BofcBackend.Api.Domain.Constants;

/// <summary>
/// Bound from the "Accounting" config section. Names the well-known chart-of-account Codes that
/// auto-generated vouchers (collections, bill payments) post to - resolved by Code via
/// AcChartService.GetAcChartByCodeAsync, never by a hardcoded database Id, so reseeding or
/// reordering the chart of accounts can't silently point postings at the wrong account.
/// </summary>
public class AccountingOptions
{
    /// <summary>The asset chart that represents cash-on-hand - debited on every collection, credited on every bill payment.</summary>
    public string CashChartCode { get; set; } = "1001";

    /// <summary>The income chart credited when a player collection is recorded.</summary>
    public string CollectionIncomeChartCode { get; set; } = "3001";
}
