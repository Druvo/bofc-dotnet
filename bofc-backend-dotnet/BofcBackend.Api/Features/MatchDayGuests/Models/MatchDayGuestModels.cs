using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.MatchDayGuests.Models;

/// <summary>Everything needed to add a guest: a MatchDay, a name and, optionally, a rank.
/// Nothing else is asked for, because nothing else is stored - see MatchDayGuest.</summary>
public class MatchDayGuestRequest
{
    public long MatchDayId { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>1-10, 1 = strongest. Null = unranked.</summary>
    [Range(1, 10)]
    public int? Rank { get; set; }
}

/// <summary>Null clears the rank.</summary>
public class MatchDayGuestRankRequest
{
    [Range(1, 10)]
    public int? Rank { get; set; }
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

    /// <summary>Only filled in for callers who may manage teams - null for everyone else,
    /// whatever the guest's actual rank.</summary>
    public int? Rank { get; set; }
}
