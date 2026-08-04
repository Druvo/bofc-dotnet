using System.Globalization;

namespace BofcBackend.Api.Common.Util;

/// <summary>Port of util/DateUtil.java.</summary>
public static class DateUtil
{
    private const string DateFormat = "dd-MM-yyyy";

    public static string GetCurrentYearMonth() => DateTime.UtcNow.ToString("yyyyMM", CultureInfo.InvariantCulture);

    public static int ParseYear(string? year)
    {
        if (string.IsNullOrWhiteSpace(year))
        {
            throw new ArgumentException("Year cannot be null or empty");
        }

        if (!int.TryParse(year.Trim(), out var parsed))
        {
            throw new ArgumentException($"Invalid year format. Expected format: 'YYYY' (e.g., '2025'). Provided: {year}");
        }

        return parsed;
    }

    public static string? FormatDate(DateTime? dateTime) =>
        dateTime?.ToString(DateFormat, CultureInfo.InvariantCulture);
}
