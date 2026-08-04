namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/MonthWiseSummary.java.</summary>
public class MonthWiseSummary
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalCollection { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal CurrentBalance { get; set; }
}
