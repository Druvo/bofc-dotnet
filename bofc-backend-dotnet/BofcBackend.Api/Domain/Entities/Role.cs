namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/Role.java. Not audited in Java (no AuditBase) - matched here.</summary>
public class Role
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<Player> Players { get; set; } = new List<Player>();
}
