namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/audit/AuditBase.java. Populated by BofcDbContext.SaveChangesAsync.</summary>
public abstract class AuditableEntity
{
    public long CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public long? LastModifiedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
