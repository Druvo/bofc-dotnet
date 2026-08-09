namespace BofcBackend.Api.Domain.Entities;

/// <summary>One of the club's physical jerseys — SystemSettings owns a configurable-length list
/// (previously hardcoded to exactly 2, JerseyColorA/JerseyColorB) so a club with 3+ jerseys can
/// configure all of them. Match-day jersey assignment (Match.HomeJerseyColor/AwayJerseyColor) is
/// constrained to whatever's configured here. Not audited (small config table owned entirely by
/// SettingsService, same as SystemSettings itself).</summary>
public class JerseyColor
{
    public long Id { get; set; }
    public long SystemSettingsId { get; set; }
    public SystemSettings SystemSettings { get; set; } = null!;
    public string Color { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
