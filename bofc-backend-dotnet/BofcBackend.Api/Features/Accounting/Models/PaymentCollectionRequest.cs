using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/PaymentCollectionRequest.java.</summary>
public class PaymentCollectionRequest
{
    [Required(ErrorMessage = "Player ID is required")]
    [MinLength(1, ErrorMessage = "Player ID is required")]
    public HashSet<long> PlayerIds { get; set; } = [];

    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero")]
    public decimal? Amount { get; set; }

    [Required(ErrorMessage = "Date is required")]
    public DateTime? Date { get; set; }

    [Required(ErrorMessage = "Month of payment is required")]
    public DateTime? MonthOfPayment { get; set; }

    public string? Description { get; set; }

    /// <summary>Which real-world bank/bKash account the money came into — optional, informational only.</summary>
    public long? PaymentAccountId { get; set; }
}
