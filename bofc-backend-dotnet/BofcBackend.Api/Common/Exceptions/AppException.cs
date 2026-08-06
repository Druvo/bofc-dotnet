using System.Net;

namespace BofcBackend.Api.Common.Exceptions;

/// <summary>
/// Base for the ported exception/{...}ServiceException.java hierarchy — each carries
/// its own HttpStatusCode, same pattern as the Java @Getter HttpStatus field.
/// </summary>
public abstract class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }

    protected AppException(string message, HttpStatusCode statusCode) : base(message)
    {
        StatusCode = statusCode;
    }
}

public class ResourceNotFoundException(string message, HttpStatusCode statusCode = HttpStatusCode.NotFound)
    : AppException(message, statusCode);

/// <summary>
/// Named Bofc*SecurityException (not SecurityException) to avoid colliding with
/// System.Security.SecurityException — the Java class shadows java.lang.SecurityException,
/// which isn't a naming collision worth reproducing in .NET.
/// </summary>
public class BofcSecurityException(string message, HttpStatusCode statusCode) : AppException(message, statusCode);

public class PlayerServiceException(string message, HttpStatusCode statusCode) : AppException(message, statusCode);

public class TeamServiceException(string message, HttpStatusCode statusCode) : AppException(message, statusCode);

public class MatchDayServiceException(string message, HttpStatusCode statusCode) : AppException(message, statusCode);

public class CostTypeServiceException(string message, HttpStatusCode statusCode) : AppException(message, statusCode);

public class RoundServiceException(string message, HttpStatusCode statusCode) : AppException(message, statusCode);

public class VenueServiceException(string message, HttpStatusCode statusCode) : AppException(message, statusCode);

public class BadRequestException(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
    : AppException(message, statusCode);
