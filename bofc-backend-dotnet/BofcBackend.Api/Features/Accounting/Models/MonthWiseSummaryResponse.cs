namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/MonthWiseSummaryResponse.java.</summary>
public class MonthWiseSummaryResponse
{
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal ClosingBalance { get; set; }
}
