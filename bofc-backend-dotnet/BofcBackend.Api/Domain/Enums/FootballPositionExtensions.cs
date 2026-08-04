namespace BofcBackend.Api.Domain.Enums;

/// <summary>
/// Port of enums/FootballPosition.java's description map + getPositionOrDefault. Matches by the
/// human-readable description text (case-insensitive), not the enum constant name — replicated
/// as-is, including the quirk that multi-word constants only match their spaced description
/// (e.g. RIGHT_BACK matches "Right Back", not "RIGHT_BACK").
/// </summary>
public static class FootballPositionExtensions
{
    private static Dictionary<FootballPosition, string> BuildDescriptions() => new()
    {
        [FootballPosition.UNASSIGNED] = "Unassigned",
        [FootballPosition.GOALKEEPER] = "Goalkeeper",
        [FootballPosition.RIGHT_BACK] = "Right Back",
        [FootballPosition.LEFT_BACK] = "Left Back",
        [FootballPosition.CENTER_BACK_1] = "Center Back",
        [FootballPosition.CENTER_BACK_2] = "Center Back",
        [FootballPosition.DEFENSIVE_MIDFIELD] = "Defensive Midfield",
        [FootballPosition.RIGHT_WING_FORWARD] = "Right Wing/Forward",
        [FootballPosition.CENTRAL_MIDFIELD] = "Central Midfield",
        [FootballPosition.STRIKER] = "Striker",
        [FootballPosition.ATTACKING_MIDFIELD] = "Attacking Midfield",
        [FootballPosition.LEFT_WING_FORWARD] = "Left Wing/Forward",
    };

    private static readonly Dictionary<string, FootballPosition> StringToEnum =
        Enum.GetValues<FootballPosition>().ToDictionary(p => p.ToString(), p => p);

    public static string GetDescription(this FootballPosition position) => BuildDescriptions()[position];

    public static FootballPosition GetPositionOrDefault(string? position)
    {
        if (position == null)
        {
            return FootballPosition.UNASSIGNED;
        }

        return StringToEnum.TryGetValue(position.ToUpperInvariant(), out var result)
            ? result
            : FootballPosition.UNASSIGNED;
    }
}
