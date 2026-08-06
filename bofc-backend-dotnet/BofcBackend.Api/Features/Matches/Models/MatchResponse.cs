namespace BofcBackend.Api.Features.Matches.Models;

public class MatchResponse
{
    public long Id { get; set; }
    public long TournamentId { get; set; }
    public string TournamentName { get; set; } = string.Empty;
    public long HomeTeamId { get; set; }
    public string HomeTeamName { get; set; } = string.Empty;
    public long AwayTeamId { get; set; }
    public string AwayTeamName { get; set; } = string.Empty;
    public long? VenueId { get; set; }
    public string? VenueName { get; set; }
    public string? VenueMapLink { get; set; }
    public DateTime MatchDate { get; set; }

    /// <summary>MatchDate + MatchDurationMinutes — null when duration isn't set.</summary>
    public DateTime? EndTime { get; set; }
    public string MatchStatus { get; set; } = string.Empty;
    public int? MatchOrder { get; set; }

    /// <summary>Legacy round field.</summary>
    public int? Round { get; set; }

    /// <summary>Round number from TournamentRound (manual fixture system) or LegacyRound fallback.</summary>
    public int? RoundNumber { get; set; }

    public string? GroupName { get; set; }
    public int HomeTeamScore { get; set; }
    public int AwayTeamScore { get; set; }

    /// <summary>Which of the club's 2 physical jerseys each side wears for this match — null until set via Add/Edit Fixture.</summary>
    public string? HomeJerseyColor { get; set; }
    public string? AwayJerseyColor { get; set; }

    // Unused by Java's convertToResponse mapping today (never populated) — kept for wire
    // compatibility in case the frontend already reads them as optional fields.
    public int? HomeYellowCards { get; set; }
    public int? HomeRedCards { get; set; }
    public int? AwayYellowCards { get; set; }
    public int? AwayRedCards { get; set; }

    public int? MatchDurationMinutes { get; set; }
    public int ElapsedTimeSeconds { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
