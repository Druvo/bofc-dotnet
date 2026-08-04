using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Domain.Entities;

/// <summary>Port of entity/Tournament.java.</summary>
public class Tournament : AuditableEntity
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Season { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? RoadmapImageUrl { get; set; }
    public DateTime TournamentDate { get; set; }

    public long VenueId { get; set; }
    public Venue Venue { get; set; } = null!;

    public TournamentStatus TournamentStatus { get; set; }
    public bool IsActive { get; set; }
    public bool DefaultTournament { get; set; }
    public SportType SportType { get; set; }
    public TournamentType TournamentType { get; set; }
    public int? GroupCount { get; set; }
    public bool AuctionMode { get; set; }

    // Java's Tournament entity is bidirectional ONLY with Team (OneToMany "teams" below).
    // TournamentRound/TournamentParticipant/LogicNode/TournamentPrize/
    // PlayerGoalkeepingHistory/Match all reference Tournament via a unidirectional
    // @ManyToOne — Tournament does not declare a back-collection for them in Java,
    // so none is added here either (mapped via HasOne().WithMany() with no inverse).
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}
