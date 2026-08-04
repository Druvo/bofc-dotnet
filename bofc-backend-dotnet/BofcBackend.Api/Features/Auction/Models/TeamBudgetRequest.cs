using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Auction.Models;

/// <summary>Port of model/auction/TeamBudgetRequest.java.</summary>
public class TeamBudgetRequest
{
    [Required]
    public long? TeamId { get; set; }

    [Required]
    public long? OwnerId { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? TotalBudget { get; set; }
}
