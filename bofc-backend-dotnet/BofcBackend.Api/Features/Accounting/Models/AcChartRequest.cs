using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcChartRequest.java.</summary>
public class AcChartRequest
{
    [Required(ErrorMessage = "Name is required.")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Code is required.")]
    public string? Code { get; set; }

    public string? Description { get; set; }

    [Required(ErrorMessage = "Nature ID is required.")]
    public long? NatureId { get; set; }

    public long? ParentId { get; set; }
}
