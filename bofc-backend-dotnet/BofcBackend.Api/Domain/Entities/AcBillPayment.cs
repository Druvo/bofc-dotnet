namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/account/AcBillPayment.java.</summary>
public class AcBillPayment : AuditableEntity
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? Description { get; set; }

    public long CostTypeId { get; set; }
    public CostType CostType { get; set; } = null!;

    /// <summary>Which real-world bank/bKash account actually paid this out — informational only, doesn't change which ledger chart the voucher posts to.</summary>
    public long? PaymentAccountId { get; set; }
    public PaymentAccount? PaymentAccount { get; set; }

    /// <summary>Inverse side — AcVoucher owns the FK (BillPaymentId).</summary>
    public AcVoucher? Voucher { get; set; }
}
