namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/account/AcCollection.java.</summary>
public class AcCollection : AuditableEntity
{
    public long Id { get; set; }
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>Many-to-many via the "collection_players" join table — unidirectional, no back-reference on Player.</summary>
    public ICollection<Player> Players { get; set; } = new List<Player>();

    public decimal Amount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime MonthOfPayment { get; set; }
    public string? Description { get; set; }
    public DateTime Date { get; set; }

    /// <summary>Which real-world bank/bKash account the money actually came into — informational only, doesn't change which ledger chart the voucher posts to.</summary>
    public long? PaymentAccountId { get; set; }
    public PaymentAccount? PaymentAccount { get; set; }

    /// <summary>Inverse side — AcVoucher owns the FK (CollectionId).</summary>
    public AcVoucher? Voucher { get; set; }
}
