namespace BofcBackend.Api.Common.Util;

/// <summary>Port of util/StringUtils.java.</summary>
public static class StringUtils
{
    public static string? NormalizeString(string? input) => string.IsNullOrWhiteSpace(input) ? null : input;
}
