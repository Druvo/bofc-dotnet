using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Players.Models;

public class PlayerRegistrationRequest
{
    [Required(ErrorMessage = "Name is mandatory")]
    [MaxLength(255, ErrorMessage = "Name must be less than 255 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is mandatory")]
    [EmailAddress(ErrorMessage = "Email should be valid")]
    [MaxLength(255, ErrorMessage = "Email must be less than 255 characters")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Employee ID is mandatory")]
    [MaxLength(255, ErrorMessage = "Employee ID must be less than 255 characters")]
    public string EmployeeId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Teams ID is mandatory")]
    [MaxLength(255, ErrorMessage = "Teams ID must be less than 255 characters")]
    public string TeamsId { get; set; } = string.Empty;

    [MaxLength(255, ErrorMessage = "mobile No must be less than 255 characters")]
    [RegularExpression(@"^(?:\+?880|0)1[3-9]\d{8}$", ErrorMessage = "Mobile number must be a valid Bangladesh number (e.g. 01XXXXXXXXX)")]
    public string? MobileNo { get; set; }

    [MaxLength(500, ErrorMessage = "Profile photo key must be less than 500 characters")]
    public string? ProfilePhoto { get; set; }

    [Required(ErrorMessage = "Position is mandatory")]
    public FootballPosition? PlayingPosition { get; set; }

    [Range(1, 99, ErrorMessage = "Jersey number must be between 1 and 99")]
    public int? JerseyNumber { get; set; }

    public string? PhotoKey { get; set; }
}
