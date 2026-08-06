using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/AuctionRegistrationResponse.java.</summary>
public class AuctionRegistrationResponse
{
    public long Id { get; set; }
    public long MatchDayId { get; set; }
    public string MatchDayName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string? TeamsId { get; set; }
    public string? MobileNo { get; set; }
    public FootballPosition PlayingPosition { get; set; }
    public string? BattingStyle { get; set; }
    public string? BowlingStyle { get; set; }
    public string? PreviousExperience { get; set; }
    public AvailabilityStatus AvailabilityStatus { get; set; }
    public string? ProfilePhoto { get; set; }
    public string? EmergencyContact { get; set; }
    public int? PreferredBasePrice { get; set; }
    public ApprovalStatus ApprovalStatus { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedDate { get; set; }
    public long? CreatedPlayerId { get; set; }
    public bool InAuctionPool { get; set; }
}
