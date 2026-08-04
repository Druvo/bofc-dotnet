using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.PaymentAccounts.Models;

public class PaymentAccountRequest
{
    [Required(ErrorMessage = "Account type is required.")]
    public PaymentAccountType? AccountType { get; set; }

    [Required(ErrorMessage = "Account name is required.")]
    public string? AccountName { get; set; }

    [Required(ErrorMessage = "Account number is required.")]
    public string? AccountNumber { get; set; }

    public string? BankName { get; set; }
    public string? Branch { get; set; }
    public string? Note { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
