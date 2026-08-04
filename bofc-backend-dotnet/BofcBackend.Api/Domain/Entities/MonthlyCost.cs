namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/MonthlyCost.java.</summary>
public class MonthlyCost : AuditableEntity
{
    public long Id { get; set; }

    public long CostTypeId { get; set; }
    public CostType CostType { get; set; } = null!;

    public double Amount { get; set; }
    public DateTime MonthOfCost { get; set; }
    public string? Description { get; set; }
}
