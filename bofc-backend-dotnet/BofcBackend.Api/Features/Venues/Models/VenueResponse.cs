namespace BofcBackend.Api.Features.Venues.Models;

public class VenueResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? MapLink { get; set; }
    public bool Active { get; set; }
}
