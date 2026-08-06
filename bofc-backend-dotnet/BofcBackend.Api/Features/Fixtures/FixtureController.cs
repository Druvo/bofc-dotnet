using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Fixtures.Models;
using BofcBackend.Api.Features.Matches.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Fixtures;

/// <summary>
/// Port of controller/FixtureController.java — the legacy auto-fixture-generation controller.
/// Marked @deprecated in Java in favor of the manual fixture system (MatchDayRoundController /
/// RoundGroupController / LogicNodeController) but still live, so ported as-is.
///
/// Has its own convertToResponse (with disciplinary-card counts from MatchEvents) distinct from
/// MatchManagementService's — matches Java's actual duplication rather than reusing that mapper.
/// </summary>
[ApiController]
[Route("fixtures")]
public class FixtureController(IFixtureGenerationService fixtureGenerationService, BofcDbContext db) : ControllerBase
{
    private const string AdminSuperAdminCoordinator = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator;

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateFixtures([FromBody] FixtureGenerationRequest request)
    {
        var matches = await fixtureGenerationService.GenerateFixturesAsync(request.MatchDayId!.Value, request);
        var responses = matches.Select(ConvertToResponse).ToList();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, "Fixtures generated successfully", responses);
    }

    [AllowAnonymous]
    [HttpGet("match-day/{matchDayId}")]
    public async Task<IActionResult> GetFixturesByMatchDay(long matchDayId)
    {
        var matches = await LoadMatchesAsync(m => m.MatchDayId == matchDayId);

        if (matches.Count == 0)
        {
            return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "No fixtures found for this MatchDay", matches.Select(ConvertToResponse).ToList());
        }

        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Fixtures retrieved successfully", matches.Select(ConvertToResponse).ToList());
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpDelete("match-day/{matchDayId}")]
    public async Task<IActionResult> ClearFixtures(long matchDayId)
    {
        await fixtureGenerationService.ClearFixturesAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Fixtures cleared successfully");
    }

    [Authorize(Roles = AdminSuperAdminCoordinator)]
    [HttpPut("{matchId}")]
    public async Task<IActionResult> UpdateMatchFixture(long matchId, [FromBody] MatchFixtureUpdateRequest request)
    {
        var updatedMatch = await fixtureGenerationService.UpdateMatchFixtureAsync(matchId, request);
        var reloaded = await LoadMatchesAsync(m => m.Id == updatedMatch.Id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, "Match fixture updated successfully", ConvertToResponse(reloaded[0]));
    }

    private async Task<List<Match>> LoadMatchesAsync(System.Linq.Expressions.Expression<Func<Match, bool>> predicate) =>
        await db.Matches
            .Include(m => m.MatchDay)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Venue)
            .Include(m => m.Round)
            .Include(m => m.Group)
            .Include(m => m.MatchEvents).ThenInclude(e => e.Team)
            .Where(predicate)
            .OrderBy(m => m.MatchDate)
            .ToListAsync();

    private static MatchResponse ConvertToResponse(Match match)
    {
        var roundNumber = match.Round?.RoundNumber ?? match.LegacyRound;
        var groupName = match.GroupName ?? match.Group?.GroupName;

        int homeYellow = 0, homeRed = 0, awayYellow = 0, awayRed = 0;
        var homeTeamId = match.HomeTeam.Id;
        var awayTeamId = match.AwayTeam.Id;

        foreach (var evt in match.MatchEvents)
        {
            if ((evt.EventType != MatchEventType.YELLOW_CARD && evt.EventType != MatchEventType.RED_CARD) || evt.Team == null)
            {
                continue;
            }

            var isHome = homeTeamId == evt.Team.Id;
            var isAway = awayTeamId == evt.Team.Id;

            if (evt.EventType == MatchEventType.YELLOW_CARD)
            {
                if (isHome) homeYellow++;
                else if (isAway) awayYellow++;
            }
            else
            {
                if (isHome) homeRed++;
                else if (isAway) awayRed++;
            }
        }

        return new MatchResponse
        {
            Id = match.Id,
            MatchDayId = match.MatchDay.Id,
            MatchDayName = match.MatchDay.Name,
            HomeTeamId = match.HomeTeam.Id,
            HomeTeamName = match.HomeTeam.TeamName,
            AwayTeamId = match.AwayTeam.Id,
            AwayTeamName = match.AwayTeam.TeamName,
            VenueId = match.Venue?.Id,
            VenueName = match.Venue?.Name,
            VenueMapLink = match.Venue?.MapLink,
            MatchDate = match.MatchDate,
            EndTime = match.MatchDurationMinutes != null ? match.MatchDate.AddMinutes(match.MatchDurationMinutes.Value) : null,
            MatchStatus = match.MatchStatus.ToString(),
            MatchOrder = match.MatchOrder,
            Round = match.LegacyRound,
            RoundNumber = roundNumber,
            GroupName = groupName,
            HomeTeamScore = match.HomeTeamScore,
            AwayTeamScore = match.AwayTeamScore,
            HomeJerseyColor = match.HomeJerseyColor,
            AwayJerseyColor = match.AwayJerseyColor,
            HomeYellowCards = homeYellow,
            HomeRedCards = homeRed,
            AwayYellowCards = awayYellow,
            AwayRedCards = awayRed,
            MatchDurationMinutes = match.MatchDurationMinutes,
            ElapsedTimeSeconds = match.ElapsedTimeSeconds,
            StartedAt = match.StartedAt,
            CompletedAt = match.CompletedAt,
            CreatedDate = match.CreatedDate,
            UpdatedDate = match.UpdatedDate,
        };
    }
}
