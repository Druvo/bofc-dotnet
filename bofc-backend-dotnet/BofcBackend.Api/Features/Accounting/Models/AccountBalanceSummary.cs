namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/AccountBalanceSummary.java.</summary>
public class AccountBalanceSummary
{
    public string AccountType { get; set; } = string.Empty;
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal NetBalance { get; set; }
}
