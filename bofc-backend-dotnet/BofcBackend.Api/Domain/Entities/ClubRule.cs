namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/ClubRule.java.</summary>
public class ClubRule : AuditableEntity
{
    public long Id { get; set; }
    public string? Description { get; set; }
}
