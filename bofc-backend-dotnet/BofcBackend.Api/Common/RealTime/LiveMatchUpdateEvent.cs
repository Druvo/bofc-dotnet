namespace BofcBackend.Api.Common.RealTime;

/// <summary>Port of model/LiveMatchUpdateEvent.java.</summary>
public class LiveMatchUpdateEvent
{
    public long TournamentId { get; set; }
    public long? MatchId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public long Timestamp { get; set; }
}
