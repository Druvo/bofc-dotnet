using BofcBackend.Api.Features.Players.Models;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcVoucherResponse.java.</summary>
public class AcVoucherResponse
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Narration { get; set; }
    public DateTime VoucherDate { get; set; }
    public decimal Amount { get; set; }
    public bool PostFlag { get; set; }
    public PlayerResponse? PostedBy { get; set; }
    public DateTime? PostDate { get; set; }
    public AcVoucherTypeResponse VoucherType { get; set; } = null!;
    public List<AcVoucherDetailResponse>? Details { get; set; }
    public AcCollectionResponse? Collection { get; set; }
    public AcBillPaymentResponse? BillPayment { get; set; }
}
