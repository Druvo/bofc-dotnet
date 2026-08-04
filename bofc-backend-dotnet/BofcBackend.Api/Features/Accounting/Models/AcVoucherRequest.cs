using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>
/// Port of model/account/AcVoucherRequest.java. Java's Collection/BillPayment fields carry full
/// JPA entities (set internally by AcCollectionService/AcBillPaymentService before delegating to
/// AcVoucherService) — modeled here as plain nullable ids instead, since only the id is ever used
/// to set the FK; the public endpoint never populates them (a client has no entity graph to send).
/// </summary>
public class AcVoucherRequest
{
    [MaxLength(500)]
    public string? Narration { get; set; }

    [Required(ErrorMessage = "Voucher date is required")]
    public DateTime? VoucherDate { get; set; }

    public bool PostFlag { get; set; }

    [Required(ErrorMessage = "Voucher type ID is required")]
    public long? VoucherTypeId { get; set; }

    [Required(ErrorMessage = "Voucher details cannot be empty")]
    [MinLength(1, ErrorMessage = "Voucher details cannot be empty")]
    public List<AcVoucherDetailRequest> Details { get; set; } = [];

    public long? CollectionId { get; set; }
    public long? BillPaymentId { get; set; }
}
