using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcNatureRequest.java.</summary>
public class AcNatureRequest
{
    [Required(ErrorMessage = "Name is required.")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Code is required.")]
    public int? Code { get; set; }

    public string? Description { get; set; }

    [Required(ErrorMessage = "Type is required.")]
    public AcNatureType? Type { get; set; }

    public int? SlNo { get; set; }
}
