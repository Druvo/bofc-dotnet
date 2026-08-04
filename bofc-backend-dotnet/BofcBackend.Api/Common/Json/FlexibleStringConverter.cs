using System.Text.Json;
using System.Text.Json.Serialization;

namespace BofcBackend.Api.Common.Json;

/// <summary>
/// Jackson (the Java backend's JSON library) silently coerces a JSON number into a
/// Java String field by default. System.Text.Json does not — it throws
/// "The JSON value could not be converted to System.String" instead. Some frontend
/// form fields send string-typed values (e.g. employeeId) through an Ant Design
/// InputNumber, so the wire payload is a JSON number even though the DTO property
/// is a string. This converter restores Jackson's leniency so those requests don't
/// 400 on a type technicality the frontend was never written to avoid.
/// </summary>
public class FlexibleStringConverter : JsonConverter<string?>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        reader.TokenType switch
        {
            JsonTokenType.String => reader.GetString(),
            JsonTokenType.Null => null,
            JsonTokenType.Number => reader.TryGetInt64(out var l) ? l.ToString() : reader.GetDouble().ToString(),
            JsonTokenType.True or JsonTokenType.False => reader.GetBoolean().ToString(),
            _ => throw new JsonException($"Cannot convert {reader.TokenType} to string."),
        };

    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value);
}
