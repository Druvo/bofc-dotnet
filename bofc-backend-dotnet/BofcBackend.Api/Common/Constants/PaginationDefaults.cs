namespace BofcBackend.Api.Common.Constants;

/// <summary>Port of util/PaginationUtil.java's constants.</summary>
public static class PaginationDefaults
{
    public const int DefaultPageSize = 10;
    public const int DefaultPageNumber = 0;
    public const string DefaultSortedColumn = "id";

    /// <summary>
    /// Upper bound applied to "fetch all" list endpoints that do not yet expose pagination.
    /// Keeps the result set bounded as the underlying tables grow, instead of loading every
    /// row into memory.
    /// </summary>
    public const int MaxListSize = 1000;
}
