using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Players.Models;

/// <summary>Port of model/RoleRequest.java.</summary>
public class RoleRequest
{
    [Required(ErrorMessage = "Role name is required")]
    public string? Name { get; set; }
}
