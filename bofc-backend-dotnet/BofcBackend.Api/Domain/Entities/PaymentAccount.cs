using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// Admin-managed bank/bKash details shown to all users so they know where to
/// send MatchDay dues and other club payments.
/// </summary>
public class PaymentAccount : AuditableEntity
{
    public long Id { get; set; }
    public PaymentAccountType AccountType { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? Branch { get; set; }
    public string? Note { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
