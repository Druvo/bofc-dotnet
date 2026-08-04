using System.Text.Json.Serialization;

namespace BofcBackend.Api.Common.Models;

/// <summary>
/// Mirrors the Java backend's Response.java envelope exactly (field names/casing)
/// so the existing frontend (BasicResType) needs zero changes.
/// </summary>
public class ApiResponse
{
    public long TimeStamp { get; set; }
    public int StatusCode { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Content { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? NumberOfElement { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public long? RowCount { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<ApiErrorDetail>? Errors { get; set; }
}

public class ApiErrorDetail
{
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Field { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; set; }
}
