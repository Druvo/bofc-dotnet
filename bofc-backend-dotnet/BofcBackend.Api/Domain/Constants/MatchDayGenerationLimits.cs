namespace BofcBackend.Api.Domain.Constants;

/// <summary>Bounds of the "Auto generated match number" setting - how many Match Days the
/// Generate button on the Match Days screen creates in one run.</summary>
// SPEC: spec-a6f59e
public static class MatchDayGenerationLimits
{
    public const int Min = 1;
    public const int Max = 8;
    public const int Default = 2;
}
