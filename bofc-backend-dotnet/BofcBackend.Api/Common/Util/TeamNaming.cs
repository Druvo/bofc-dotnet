namespace BofcBackend.Api.Common.Util;

/// <summary>Default names for teams nobody has named yet.
///
/// Letters rather than numbers, and in one place rather than two: the club's own printed schedule
/// names its teams "Team A" through "Team D", so a fixture list reading "Team 1 v Team 3" while
/// the sheet in the changing room says "A v C" makes whoever is holding both do a translation for
/// no reason. The manual "+ Add Team" button already produced letters; the weekly auto-generator
/// produced numbers, which is how the two drifted apart.</summary>
public static class TeamNaming
{
    /// <summary>Zero-based: 0 gives "Team A". Past Z it falls back to a number - no match day comes
    /// close to 26 teams, but a name that silently ran off the end of the alphabet would be worse
    /// than an ugly one.</summary>
    public static string DefaultName(int index) =>
        index < 26 ? $"Team {(char)('A' + index)}" : $"Team {index + 1}";
}
