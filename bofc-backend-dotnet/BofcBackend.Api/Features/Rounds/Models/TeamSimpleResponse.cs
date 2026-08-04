namespace BofcBackend.Api.Features.Rounds.Models;

public class TeamSimpleResponse
{
    public long? Id { get; set; }
    public string? TeamName { get; set; }
    public bool? IsPlaceholder { get; set; }
    public string? PlaceholderName { get; set; }
    public int? SeedPosition { get; set; }
    public string? AssignmentType { get; set; }
}
