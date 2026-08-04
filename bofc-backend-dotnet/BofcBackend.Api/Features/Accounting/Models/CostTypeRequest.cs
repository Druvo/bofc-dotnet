using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/CostTypeRequest.java.</summary>
public class CostTypeRequest
{
    [Required(ErrorMessage = "Name is mandatory")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Description is mandatory")]
    public string? Description { get; set; }
}
