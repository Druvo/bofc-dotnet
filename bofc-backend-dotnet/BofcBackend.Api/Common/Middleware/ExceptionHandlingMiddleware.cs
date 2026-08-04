using System.Net;
using System.Text.Json;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Json;
using Microsoft.Data.SqlClient;

namespace BofcBackend.Api.Common.Middleware;

/// <summary>
/// Port of exception/RestResponseEntityExceptionHandler.java's @ExceptionHandler methods —
/// ASP.NET Core has no @ControllerAdvice equivalent, so this middleware is the single seam
/// that turns any exception into the same ApiResponse envelope shape.
/// Model-binding/validation errors are handled separately via ApiBehaviorOptions
/// (see Program.cs) since those need to run inside the MVC pipeline, not here.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException ex)
        {
            logger.LogError(ex, "Application exception: {Message}", ex.Message);
            await WriteResponse(context, ex.StatusCode, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            // Mirrors Java's IllegalStateException -> 400 handling (heaviest use: auction state machine).
            logger.LogWarning("Illegal state: {Message}", ex.Message);
            await WriteResponse(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning("Illegal argument: {Message}", ex.Message);
            await WriteResponse(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (SqlException ex)
        {
            logger.LogError(ex, "SQL Server exception occurred");
            await WriteResponse(context, HttpStatusCode.InternalServerError, RestErrorMessageDetail.SqlError);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteResponse(context, HttpStatusCode.InternalServerError, RestErrorMessageDetail.InternalServerError);
        }
    }

    private static Task WriteResponse(HttpContext context, HttpStatusCode status, string message)
    {
        if (context.Response.HasStarted)
        {
            return Task.CompletedTask;
        }

        context.Response.Clear();
        context.Response.StatusCode = (int)status;
        context.Response.ContentType = "application/json";
        var body = ResponseBuilder.BuildRaw(status, message);
        return context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonDefaults.Options));
    }
}
