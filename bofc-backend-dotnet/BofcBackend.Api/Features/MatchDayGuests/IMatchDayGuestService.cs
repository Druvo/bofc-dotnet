using BofcBackend.Api.Features.MatchDayGuests.Models;

namespace BofcBackend.Api.Features.MatchDayGuests;

/// <summary>Guest players on a MatchDay - names on a team sheet, with no Player profile
/// behind them. See <see cref="Domain.Entities.MatchDayGuest"/>.</summary>
public interface IMatchDayGuestService
{
    /// <summary>Every guest on the MatchDay, assigned and unassigned alike - the caller
    /// splits them by TeamId (null = Unassigned Pool).</summary>
    Task<List<MatchDayGuestResponse>> GetGuestsAsync(long matchDayId);

    /// <summary>Adds a guest to the Unassigned Pool. Never creates a Player.</summary>
    Task<MatchDayGuestResponse> AddGuestAsync(MatchDayGuestRequest request);

    /// <summary>Moves a guest onto a team, or back to the pool when TeamId is null. The team
    /// must belong to the same MatchDay as the guest.</summary>
    Task<MatchDayGuestResponse> AssignGuestToTeamAsync(long guestId, MatchDayGuestTeamRequest request);

    /// <summary>Sets or clears (null) the guest's rank. Only the draft reads it, so this is
    /// allowed after teams exist too - it simply has no effect until teams are regenerated.</summary>
    Task<MatchDayGuestResponse> SetGuestRankAsync(long guestId, MatchDayGuestRankRequest request);

    Task RemoveGuestAsync(long guestId);
}
