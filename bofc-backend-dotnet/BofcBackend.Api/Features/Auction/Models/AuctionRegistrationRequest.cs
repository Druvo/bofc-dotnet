using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionRegistrationRequest.java.</summary>
public class AuctionRegistrationRequest
{
    public long? TournamentId { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required, EmailAddress]
    public string? Email { get; set; }

    [Required]
    public string? EmployeeId { get; set; }

    public string? TeamsId { get; set; }
    public string? MobileNo { get; set; }

    [Required]
    public FootballPosition? PlayingPosition { get; set; }

    public string? BattingStyle { get; set; }
    public string? BowlingStyle { get; set; }
    public string? PreviousExperience { get; set; }
    public AvailabilityStatus? AvailabilityStatus { get; set; }
    public string? ProfilePhoto { get; set; }
    public string? EmergencyContact { get; set; }
    public int? PreferredBasePrice { get; set; }
}
