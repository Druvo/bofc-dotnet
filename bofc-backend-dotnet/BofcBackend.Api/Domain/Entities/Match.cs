using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// Port of entity/Match.java. Carries both the legacy flat round/group fields
/// (LegacyRound, GroupName) and the new relational round/group system side-by-side,
/// matching the Java entity exactly - not our place to drop the legacy columns.
/// </summary>
public class Match : AuditableEntity
{
    public long Id { get; set; }

    public long MatchDayId { get; set; }
    public MatchDay MatchDay { get; set; } = null!;

    public long? RoundId { get; set; }
    public MatchDayRound? Round { get; set; }

    public long? GroupId { get; set; }
    public RoundGroup? Group { get; set; }

    public long HomeTeamId { get; set; }
    public Team HomeTeam { get; set; } = null!;

    public long AwayTeamId { get; set; }
    public Team AwayTeam { get; set; } = null!;

    public long? VenueId { get; set; }
    public Venue? Venue { get; set; }

    public DateTime MatchDate { get; set; }
    public MatchStatus MatchStatus { get; set; }
    public int? MatchOrder { get; set; }

    /// <summary>Legacy field for the old fixture system.</summary>
    public int? LegacyRound { get; set; }

    /// <summary>Legacy field for the old fixture system.</summary>
    public string? GroupName { get; set; }

    public bool IsPlaceholderMatch { get; set; }
    public Enums.MatchType? MatchType { get; set; }
    public int? SeriesNumber { get; set; }
    public string? BracketPosition { get; set; }
    public int HomeTeamScore { get; set; }
    public int AwayTeamScore { get; set; }

    /// <summary>Which of the club's 2 physical jerseys each side wears for THIS match - the
    /// club only owns 2, so teams swap between them match to match. Set manually per match
    /// (Add/Edit Fixture), never auto-assigned by fixture generation.</summary>
    public string? HomeJerseyColor { get; set; }
    public string? AwayJerseyColor { get; set; }
    public int? MatchDurationMinutes { get; set; }
    public int ElapsedTimeSeconds { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<MatchEvent> MatchEvents { get; set; } = new List<MatchEvent>();
    public ICollection<MatchStatistics> MatchStatistics { get; set; } = new List<MatchStatistics>();
}
