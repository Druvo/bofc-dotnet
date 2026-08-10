namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// Port of entity/account/AcChart.java. Java redeclares createdDate/updatedDate directly on
/// this entity (shadowing AuditBase's @CreatedDate/@LastModifiedDate-annotated fields), which
/// means Spring's auditing listener does NOT auto-populate them for this entity specifically -
/// normalized here to the same AuditableEntity base every other entity uses (auto-populated by
/// BofcDbContext.SaveChanges) rather than reproducing that shadowing quirk.
/// </summary>
public class AcChart : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public long? ParentId { get; set; }
    public AcChart? Parent { get; set; }

    public long NatureId { get; set; }
    public AcNature Nature { get; set; } = null!;

    public bool IsActive { get; set; }
}
