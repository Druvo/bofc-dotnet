using BofcBackend.Api.Features.Players.Models;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcCollectionResponse.java.</summary>
public class AcCollectionResponse
{
    public long Id { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime MonthOfPayment { get; set; }
    public decimal Amount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public List<PlayerResponse> Players { get; set; } = [];
    public HashSet<long> PlayerIds { get; set; } = [];
    public string AllPayersName { get; set; } = string.Empty;
    public long? VoucherId { get; set; }
    public string? VoucherCode { get; set; }
    public long? PaymentAccountId { get; set; }
    public string? PaymentAccountName { get; set; }
}
