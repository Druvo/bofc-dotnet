namespace BofcBackend.Api.Domain.Enums;

/// <summary>
/// Port of enums/FootballPosition.java. Member names intentionally match the Java
/// enum constants exactly (not C# PascalCase convention) because they're persisted
/// as strings (EnumType.STRING) and serialized verbatim to the frontend's wire format.
/// </summary>
public enum FootballPosition
{
    UNASSIGNED,
    GOALKEEPER,
    RIGHT_BACK,
    LEFT_BACK,
    CENTER_BACK_1,
    CENTER_BACK_2,
    DEFENSIVE_MIDFIELD,
    RIGHT_WING_FORWARD,
    CENTRAL_MIDFIELD,
    STRIKER,
    ATTACKING_MIDFIELD,
    LEFT_WING_FORWARD,
}
