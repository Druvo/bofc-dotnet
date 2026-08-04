namespace BofcBackend.Api.Features.Players.Models;

/// <summary>Port of model/FootballPositionResponse.java.</summary>
public class FootballPositionResponse(string name, string description)
{
    public string Name { get; set; } = name;
    public string Description { get; set; } = description;
}
