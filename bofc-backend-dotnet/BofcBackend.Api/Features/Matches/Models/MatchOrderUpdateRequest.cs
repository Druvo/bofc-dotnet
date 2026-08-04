using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Matches.Models;

public class MatchOrderUpdateRequest
{
    [Required(ErrorMessage = "Match orders are required")]
    public List<MatchOrderItem> MatchOrders { get; set; } = new();

    public class MatchOrderItem
    {
        [Required(ErrorMessage = "Match ID is required")]
        public long? MatchId { get; set; }

        [Required(ErrorMessage = "Match order is required")]
        public int? MatchOrder { get; set; }
    }
}
