using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Players.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Players;

/// <summary>Port of controller/FootballPositionController.java.</summary>
[ApiController]
[Route("football-positions")]
public class FootballPositionController : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public IActionResult GetAllFootballPositions()
    {
        var positions = Enum.GetValues<FootballPosition>()
            .Select(p => new FootballPositionResponse(p.ToString(), p.GetDescription()))
            .ToList();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, positions);
    }
}
