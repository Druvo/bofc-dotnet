using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Accounting.Models;

public class PaymentWaiverRequest
{
    [Required]
    public long? PlayerId { get; set; }

    [Required, Range(2000, 2100)]
    public int? Year { get; set; }

    [Required, Range(1, 12)]
    public int? Month { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}

public class PaymentWaiverResponse
{
    public long Id { get; set; }
    public long PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedDate { get; set; }
}
