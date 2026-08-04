namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/account/AcVoucher.java.</summary>
public class AcVoucher : AuditableEntity
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Narration { get; set; }
    public DateTime VoucherDate { get; set; }
    public decimal Amount { get; set; }
    public bool PostFlag { get; set; }

    public long? PostedById { get; set; }
    public Player? PostedBy { get; set; }

    public DateTime? PostDate { get; set; }

    public long VoucherTypeId { get; set; }
    public AcVoucherType VoucherType { get; set; } = null!;

    public ICollection<AcVoucherDetail> Details { get; set; } = new List<AcVoucherDetail>();

    public long? CollectionId { get; set; }
    public AcCollection? Collection { get; set; }

    public long? BillPaymentId { get; set; }
    public AcBillPayment? BillPayment { get; set; }
}
