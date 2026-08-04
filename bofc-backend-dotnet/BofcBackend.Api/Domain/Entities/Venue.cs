namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/Venue.java.</summary>
public class Venue : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? MapLink { get; set; }
    public bool IsActive { get; set; } = true;
}
