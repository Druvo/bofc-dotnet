namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcVoucherDetailResponse.java.</summary>
public class AcVoucherDetailResponse
{
    public long Id { get; set; }
    public string? Narration { get; set; }
    public decimal? Dr { get; set; }
    public decimal? Cr { get; set; }
    public AcChartResponse AcChart { get; set; } = null!;
    public string? ReferenceNo { get; set; }
}
