using System.Net;
using BofcBackend.Api.Common.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace BofcBackend.Api.Common;

/// <summary>
/// Port of util/ResponseBuilder.java - kept as a static helper (not middleware-wrapped
/// success responses) so each ported controller action builds its envelope explicitly,
/// same as the Java controllers do today.
/// </summary>
public static class ResponseBuilder
{
    public static IActionResult BuildSuccessResponse(HttpStatusCode status, string message, object? content = null)
    {
        var response = new ApiResponse
        {
            TimeStamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            StatusCode = (int)status,
            Status = status.ToString(),
            Message = message,
            Content = content,
        };
        return new ObjectResult(response) { StatusCode = (int)status };
    }

    public static IActionResult BuildSuccessResponse(HttpStatusCode status, string message, object? content,
        int numberOfElement, long? rowCount = null)
    {
        var response = new ApiResponse
        {
            TimeStamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            StatusCode = (int)status,
            Status = status.ToString(),
            Message = message,
            Content = content,
            NumberOfElement = numberOfElement,
            RowCount = rowCount,
        };
        return new ObjectResult(response) { StatusCode = (int)status };
    }

    public static IActionResult BuildFailureResponse(HttpStatusCode status, string message)
        => BuildSuccessResponse(status, message);

    public static IActionResult BuildFailureResponse(ModelStateDictionary modelState, string message)
    {
        var errors = modelState
            .Where(kvp => kvp.Value?.Errors.Count > 0)
            .SelectMany(kvp => kvp.Value!.Errors.Select(e => new ApiErrorDetail
            {
                // ModelState keys are the C# property name (PascalCase); lowercase the
                // first letter so it matches the camelCase JSON field name the Java
                // side reports (bean property names: email, password, ...).
                Field = ToCamelCase(kvp.Key),
                Message = string.IsNullOrEmpty(e.ErrorMessage) ? e.Exception?.Message : e.ErrorMessage,
            }))
            .ToList();

        var response = new ApiResponse
        {
            TimeStamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            StatusCode = (int)HttpStatusCode.BadRequest,
            Status = HttpStatusCode.BadRequest.ToString(),
            Message = message,
            Errors = errors,
        };
        return new ObjectResult(response) { StatusCode = (int)HttpStatusCode.BadRequest };
    }

    private static string ToCamelCase(string value) =>
        string.IsNullOrEmpty(value) ? value : char.ToLowerInvariant(value[0]) + value[1..];

    /// <summary>Raw (non-MVC) variant for use from middleware / auth events, where an IActionResult can't be returned.</summary>
    public static ApiResponse BuildRaw(HttpStatusCode status, string message) => new()
    {
        TimeStamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        StatusCode = (int)status,
        Status = status.ToString(),
        Message = message,
    };
}
