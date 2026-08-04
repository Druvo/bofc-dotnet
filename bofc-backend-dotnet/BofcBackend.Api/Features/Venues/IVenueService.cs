using BofcBackend.Api.Features.Venues.Models;

namespace BofcBackend.Api.Features.Venues;

public interface IVenueService
{
    Task<List<VenueResponse>> GetAllVenuesAsync();
    Task RegisterVenueAsync(VenueRegistrationRequest request);
    Task<VenueResponse> UpdateAsync(long venueId, VenueRegistrationRequest request);
    Task UpdateStatusAsync(long venueId, bool isActive);
}
