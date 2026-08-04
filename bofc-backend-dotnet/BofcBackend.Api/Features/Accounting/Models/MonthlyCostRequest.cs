using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/MonthlyCostRequest.java.</summary>
public class MonthlyCostRequest
{
    [Required(ErrorMessage = "Cost Type ID is required")]
    public long? CostTypeId { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero")]
    public double Amount { get; set; }

    [Required(ErrorMessage = "Month of Cost is required")]
    public DateTime? MonthOfCost { get; set; }

    public string? Description { get; set; }
}
