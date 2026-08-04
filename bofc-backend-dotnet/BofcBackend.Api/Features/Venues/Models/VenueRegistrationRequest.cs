using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Venues.Models;

public class VenueRegistrationRequest
{
    [Required(ErrorMessage = "Venue name is required.")]
    [MaxLength(100, ErrorMessage = "Venue name must not exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Venue address is required.")]
    [MaxLength(255, ErrorMessage = "Venue address must not exceed 255 characters.")]
    public string Address { get; set; } = string.Empty;

    [Url(ErrorMessage = "Map link must be a valid URL.")]
    [MaxLength(500, ErrorMessage = "Map link must not exceed 500 characters.")]
    public string? MapLink { get; set; }
}
