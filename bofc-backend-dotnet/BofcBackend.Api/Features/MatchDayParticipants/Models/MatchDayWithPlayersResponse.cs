namespace BofcBackend.Api.Features.MatchDayParticipants.Models;

public class MatchDayWithPlayersResponse
{
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public DateTime? MatchDayDate { get; set; }
    public int? DurationMinutes { get; set; }
    public long TotalParticipants { get; set; }
    public List<PlayerParticipationResponse> Players { get; set; } = [];

    /// <summary>True when SystemSettings.VotingLockEnabled and "now" is inside the configured
    /// lock window before kickoff - the Join MatchDay page disables Yes/No once this is true
    /// instead of letting the player hit the same 400 on every click.</summary>
    public bool VotingLocked { get; set; }
}
