using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/AccountsReport.java.</summary>
public class AccountsReport
{
    public AcNatureType AccountType { get; set; }
    public long AccountId { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal Balance { get; set; }
}
