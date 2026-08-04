using System.Text.Json;
using System.Text.Json.Serialization;

namespace BofcBackend.Api.Common.Json;

/// <summary>
/// Shared serializer options so ad-hoc writes (middleware, JwtBearerEvents) match
/// the camelCase shape the frontend expects from MVC's own JSON output.
/// </summary>
public static class JsonDefaults
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter(), new FlexibleStringConverter() },
    };
}
