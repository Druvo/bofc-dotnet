using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/account/AcVoucherType.java.</summary>
public class AcVoucherType : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
    public AcTransactionType AcTransactionType { get; set; }
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
}
