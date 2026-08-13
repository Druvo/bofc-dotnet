using System.ComponentModel.DataAnnotations;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionRegistrationRequest.java.</summary>
public class AuctionRegistrationRequest
{
    public long? MatchDayId { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required, EmailAddress]
    public string? Email { get; set; }

    [Required]
    public string? EmployeeId { get; set; }

    public string? TeamsId { get; set; }

    [RegularExpression(@"^(?:\+?880|0)1[3-9]\d{8}$", ErrorMessage = "Mobile number must be a valid Bangladesh number (e.g. 01XXXXXXXXX)")]
    public string? MobileNo { get; set; }

    [Required]
    public FootballPosition? PlayingPosition { get; set; }

    public string? BattingStyle { get; set; }
    public string? BowlingStyle { get; set; }
    public string? PreviousExperience { get; set; }
    public AvailabilityStatus? AvailabilityStatus { get; set; }
    public string? ProfilePhoto { get; set; }

    [RegularExpression(@"^(?:\+?880|0)1[3-9]\d{8}$", ErrorMessage = "Emergency contact must be a valid Bangladesh number (e.g. 01XXXXXXXXX)")]
    public string? EmergencyContact { get; set; }
    public int? PreferredBasePrice { get; set; }
}
