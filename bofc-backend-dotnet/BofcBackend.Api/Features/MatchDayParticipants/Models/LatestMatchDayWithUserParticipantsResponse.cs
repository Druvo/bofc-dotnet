using BofcBackend.Api.Features.MatchDays.Models;

namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class LatestMatchDayWithUserParticipantsResponse
{
    public MatchDayResponse MatchDay { get; set; } = null!;
    public int TotalParticipant { get; set; }
    public int RemainParticipant { get; set; }
    public int TotalPlayer { get; set; }
    public bool? IsUserParticipated { get; set; }
    public long? MatchDayParticipantId { get; set; }

    /// <summary>True when SystemSettings.VotingLockEnabled and "now" is inside the configured
    /// lock window before kickoff - the Dashboard card disables Yes/No once this is true instead
    /// of letting the player hit the same 400 on every click.</summary>
    public bool VotingLocked { get; set; }
}
