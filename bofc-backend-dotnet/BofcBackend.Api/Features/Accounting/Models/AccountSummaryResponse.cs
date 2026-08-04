namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/AccountSummaryResponse.java.</summary>
public class AccountSummaryResponse
{
    public decimal TotalCollection { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal CurrentBalance { get; set; }
}
