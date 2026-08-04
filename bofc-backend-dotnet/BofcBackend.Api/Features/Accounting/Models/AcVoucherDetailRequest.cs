using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcVoucherDetailRequest.java.</summary>
public class AcVoucherDetailRequest
{
    [Range(0, double.MaxValue, ErrorMessage = "Credit amount must be zero or positive")]
    public decimal? Cr { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Debit amount must be zero or positive")]
    public decimal? Dr { get; set; }

    public string? Narration { get; set; }

    [Required(ErrorMessage = "Account chart ID is required")]
    public long? AcChartId { get; set; }

    [MaxLength(100, ErrorMessage = "Reference number cannot exceed 100 characters")]
    public string? ReferenceNo { get; set; }
}
