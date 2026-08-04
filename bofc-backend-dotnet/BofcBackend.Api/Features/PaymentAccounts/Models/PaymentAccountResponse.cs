using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.PaymentAccounts.Models;

public class PaymentAccountResponse
{
    public long Id { get; set; }
    public PaymentAccountType AccountType { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? Branch { get; set; }
    public string? Note { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}
