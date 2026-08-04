using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Venues.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Venues;

/// <summary>Port of controller/VenueController.java.</summary>
[ApiController]
[Route("venues")]
public class VenueController(IVenueService venueService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllVenues()
    {
        var venues = await venueService.GetAllVenuesAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, venues);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> RegisterVenue([FromBody] VenueRegistrationRequest request)
    {
        await venueService.RegisterVenueAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVenue(long id, [FromBody] VenueRegistrationRequest request)
    {
        var updated = await venueService.UpdateAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updated);
    }

    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateVenueStatus(long id, [FromQuery] bool isActive)
    {
        await venueService.UpdateStatusAsync(id, isActive);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.StatusUpdateOk);
    }
}
