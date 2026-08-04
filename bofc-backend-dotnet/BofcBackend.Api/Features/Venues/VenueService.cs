using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Venues.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Venues;

/// <summary>Port of service/VenueServiceImpl.java.</summary>
public class VenueService(BofcDbContext db) : IVenueService
{
    public async Task<List<VenueResponse>> GetAllVenuesAsync() =>
        await db.Venues.Select(v => ToDto(v)).ToListAsync();

    public async Task RegisterVenueAsync(VenueRegistrationRequest request)
    {
        var venueName = request.Name.Trim();
        var exists = await db.Venues.AnyAsync(v => v.Name == venueName);
        if (exists)
        {
            throw new VenueServiceException(RestErrorMessageDetail.VenueAlreadyExists, HttpStatusCode.Conflict);
        }

        db.Venues.Add(new Venue { Name = venueName, Address = request.Address, MapLink = request.MapLink, IsActive = true });
        await db.SaveChangesAsync();
    }

    public async Task<VenueResponse> UpdateAsync(long venueId, VenueRegistrationRequest request)
    {
        var venue = await GetVenueByIdAsync(venueId);
        venue.Name = request.Name.Trim();
        venue.Address = request.Address;
        venue.MapLink = request.MapLink;
        await db.SaveChangesAsync();
        return ToDto(venue);
    }

    public async Task UpdateStatusAsync(long venueId, bool isActive)
    {
        var venue = await GetVenueByIdAsync(venueId);
        venue.IsActive = isActive;
        await db.SaveChangesAsync();
    }

    private async Task<Venue> GetVenueByIdAsync(long venueId) =>
        await db.Venues.FirstOrDefaultAsync(v => v.Id == venueId)
        ?? throw new VenueServiceException(RestErrorMessageDetail.VenueIsNotFound, HttpStatusCode.NotFound);

    private static VenueResponse ToDto(Venue venue) => new()
    {
        Id = venue.Id,
        Name = venue.Name,
        Address = venue.Address,
        MapLink = venue.MapLink,
        Active = venue.IsActive,
    };
}
