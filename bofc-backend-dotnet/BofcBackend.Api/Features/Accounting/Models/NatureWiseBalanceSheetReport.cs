using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/NatureWiseBalanceSheetReport.java.</summary>
public class NatureWiseBalanceSheetReport
{
    public AcNatureType NatureType { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal Balance { get; set; }
}
