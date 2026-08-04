namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/account/AcVoucherDetail.java.</summary>
public class AcVoucherDetail : AuditableEntity
{
    public long Id { get; set; }
    public string? Narration { get; set; }
    public decimal? Dr { get; set; }
    public decimal? Cr { get; set; }

    public long AcChartId { get; set; }
    public AcChart AcChart { get; set; } = null!;

    public long VoucherId { get; set; }
    public AcVoucher Voucher { get; set; } = null!;

    public string? ReferenceNo { get; set; }
}
