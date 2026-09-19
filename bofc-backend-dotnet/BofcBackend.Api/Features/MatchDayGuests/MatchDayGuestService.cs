using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.MatchDayGuests.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.MatchDayGuests;

/// <summary>See <see cref="IMatchDayGuestService"/>. Every write here is confined to the
/// match_day_guest table - no Player, MatchDayParticipant or TeamPlayer row is ever created,
/// which is what keeps a guest out of attendance, statistics and the club's mailing lists
/// without any of those needing to know guests exist.</summary>
public class MatchDayGuestService(BofcDbContext db) : IMatchDayGuestService
{
    private const int MaxNameLength = 100;

    public async Task<List<MatchDayGuestResponse>> GetGuestsAsync(long matchDayId)
    {
        return await db.MatchDayGuests
            .Where(g => g.MatchDayId == matchDayId)
            .OrderBy(g => g.Id)
            .Select(g => new MatchDayGuestResponse
            {
                GuestId = g.Id,
                MatchDayId = g.MatchDayId,
                Name = g.Name,
                TeamId = g.TeamId,
            })
            .ToListAsync();
    }

    public async Task<MatchDayGuestResponse> AddGuestAsync(MatchDayGuestRequest request)
    {
        var name = NormalizeName(request.Name);

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(m => m.Id == request.MatchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        ValidateMatchDayNotPast(matchDay);

        var guest = new MatchDayGuest
        {
            MatchDayId = matchDay.Id,
            Name = name,
            TeamId = null,
        };

        db.MatchDayGuests.Add(guest);
        await db.SaveChangesAsync();

        return ToResponse(guest);
    }

    public async Task<MatchDayGuestResponse> AssignGuestToTeamAsync(long guestId, MatchDayGuestTeamRequest request)
    {
        var guest = await GetGuestOrThrowAsync(guestId);

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(m => m.Id == guest.MatchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        ValidateMatchDayNotPast(matchDay);

        if (request.TeamId is long teamId)
        {
            // Same-MatchDay check, not just "team exists": without it a guest could be parked
            // on another MatchDay's team, where they would show up on a team sheet they were
            // never added to and no longer appear in their own MatchDay's pool.
            var teamMatchDayId = await db.Teams.Where(t => t.Id == teamId).Select(t => (long?)t.MatchDayId).FirstOrDefaultAsync()
                ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

            if (teamMatchDayId != guest.MatchDayId)
            {
                throw new BadRequestException("That team belongs to a different Match Day.");
            }

            guest.TeamId = teamId;
        }
        else
        {
            guest.TeamId = null;
        }

        await db.SaveChangesAsync();
        return ToResponse(guest);
    }

    public async Task RemoveGuestAsync(long guestId)
    {
        var guest = await GetGuestOrThrowAsync(guestId);
        db.MatchDayGuests.Remove(guest);
        await db.SaveChangesAsync();
    }

    private async Task<MatchDayGuest> GetGuestOrThrowAsync(long guestId) =>
        await db.MatchDayGuests.FirstOrDefaultAsync(g => g.Id == guestId)
            ?? throw new ResourceNotFoundException("Guest player is not Found");

    /// <summary>Guests follow the same rule as every other Team Building edit: once the
    /// MatchDay has been played, its team sheet is history and stops accepting changes
    /// (see TeamService.ValidateMatchDayDateAsync).</summary>
    private static void ValidateMatchDayNotPast(MatchDay matchDay)
    {
        if (matchDay.MatchDayDate < ClubTime.Now)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayDateCannotBePastDate, HttpStatusCode.BadRequest);
        }
    }

    private static string NormalizeName(string? name)
    {
        var trimmed = (name ?? string.Empty).Trim();
        if (trimmed.Length == 0)
        {
            throw new BadRequestException("Guest player name is required.");
        }

        return trimmed.Length > MaxNameLength ? trimmed[..MaxNameLength] : trimmed;
    }

    private static MatchDayGuestResponse ToResponse(MatchDayGuest guest) => new()
    {
        GuestId = guest.Id,
        MatchDayId = guest.MatchDayId,
        Name = guest.Name,
        TeamId = guest.TeamId,
    };
}
