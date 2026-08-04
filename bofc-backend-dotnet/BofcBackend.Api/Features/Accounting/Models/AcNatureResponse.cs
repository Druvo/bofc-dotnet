using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcNatureResponse.java.</summary>
public class AcNatureResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Code { get; set; }
    public AcNatureType Type { get; set; }
    public string? Description { get; set; }
    public int SlNo { get; set; }
}
