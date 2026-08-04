namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/CostType.java.</summary>
public class CostType : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }

    public long ChartId { get; set; }
    public AcChart Chart { get; set; } = null!;
}
