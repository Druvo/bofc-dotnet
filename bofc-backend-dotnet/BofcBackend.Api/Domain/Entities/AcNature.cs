using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/account/AcNature.java (same createdDate/updatedDate normalization as AcChart).</summary>
public class AcNature : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Code { get; set; }
    public string? Description { get; set; }
    public AcNatureType Type { get; set; }
    public int? SlNo { get; set; }
}
