namespace BofcBackend.Api.Features.MatchDayGuests.Models;

/// <summary>Everything needed to add a guest: a MatchDay and a name. Nothing else is asked
/// for, because nothing else is stored - see MatchDayGuest.</summary>
public class MatchDayGuestRequest
{
    public long MatchDayId { get; set; }
    public string Name { get; set; } = string.Empty;
}

/// <summary>Null/absent TeamId sends the guest back to the Unassigned Pool.</summary>
public class MatchDayGuestTeamRequest
{
    public long? TeamId { get; set; }
}

public class MatchDayGuestResponse
{
    public long GuestId { get; set; }
    public long MatchDayId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long? TeamId { get; set; }
}
