using System.Text.Json.Serialization;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcBillPaymentResponse.java.</summary>
public class AcBillPaymentResponse
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? Description { get; set; }
    public CostTypeResponse CostType { get; set; } = null!;
    public long? VoucherId { get; set; }
    public string? VoucherCode { get; set; }
    public long? PaymentAccountId { get; set; }
    public string? PaymentAccountName { get; set; }

    /// <summary>Java's `private boolean isPaid` - Jackson strips the "is" prefix, wire property is "paid" (confirmed against frontend IAcBillPayment.paid).</summary>
    [JsonPropertyName("paid")]
    public bool IsPaid { get; set; }
}
