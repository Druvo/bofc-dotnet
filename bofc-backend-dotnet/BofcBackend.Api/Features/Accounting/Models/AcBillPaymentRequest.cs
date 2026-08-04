using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>
/// Port of model/account/AcBillPaymentRequest.java. IsPaid is accepted but never read by
/// AcBillPaymentServiceImpl.createOrUpdateBillPaymentEntity in Java — kept for wire parity, not wired up.
/// </summary>
public class AcBillPaymentRequest
{
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal? Amount { get; set; }

    [Required]
    public DateTime? PaymentDate { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public long? CostTypeId { get; set; }

    /// <summary>Java's `private boolean isPaid` — Jackson strips the "is" prefix, wire property is "paid".</summary>
    [JsonPropertyName("paid")]
    public bool IsPaid { get; set; }

    /// <summary>Which real-world bank/bKash account actually paid this out — optional, informational only.</summary>
    public long? PaymentAccountId { get; set; }
}
