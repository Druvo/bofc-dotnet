using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Scheduling;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Teams.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Teams;

/// <summary>Port of controller/MatchDayManagementController.java (route "/teams").</summary>
[ApiController]
[Route("teams")]
[Authorize(Roles = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator)]
public class TeamController(ITeamService teamService, WeeklyMatchDayTeamGenerator weeklyMatchDayTeamGenerator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateOrUpdateTeam([FromBody] TeamRequest request)
    {
        var response = await teamService.CreateOrUpdateTeamAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpDelete("{teamId}")]
    public async Task<IActionResult> DeleteTeam(long teamId)
    {
        await teamService.DeleteTeamAsync(teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }

    [HttpPost("players")]
    public async Task<IActionResult> SaveOrUpdateTeamPlayer([FromBody] TeamPlayerRequest request)
    {
        var response = await teamService.SaveOrUpdateTeamPlayerAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpPut("players")]
    public async Task<IActionResult> UpdateTeamPlayerDetails([FromBody] TeamPlayerRequest request)
    {
        var response = await teamService.UpdateTeamPlayerDetailsAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, response);
    }

    [HttpDelete("players")]
    public async Task<IActionResult> RemovePlayerFromTeam([FromBody] TeamPlayerRemoveRequest request)
    {
        await teamService.RemovePlayerFromTeamAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }

    /// <summary>Manual on-demand rank-based team draft from the Team Building page - same
    /// snake-draft-by-rank logic the weekly scheduler uses (WeeklyMatchDayTeamGenerator), just
    /// admin-triggered for any MatchDay with an explicit max-players-per-team cap instead of the
    /// weekly scheduler's global Settings default. The number of teams is derived from confirmed
    /// participant turnout, not chosen directly. Refuses if the MatchDay already has any teams
    /// (manual or auto) - same all-or-nothing rule GenerateAsync already enforces.</summary>
    [HttpPost("matchday/{matchDayId}/generate")]
    public async Task<IActionResult> GenerateTeamsByRank(long matchDayId, [FromQuery] int maxPlayersPerTeam)
    {
        var result = await weeklyMatchDayTeamGenerator.GenerateAsync(matchDayId, maxPlayersPerTeam);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, result);
    }

    /// <summary>Fills in a goalkeeper for every team on this MatchDay that doesn't already have
    /// one, ranked by the club's fairness formula (see TeamService.ComputeGoalkeeperBalancesAsync).
    /// Never overrides a team that already has a goalkeeper assigned.</summary>
    [HttpPost("matchday/{matchDayId}/auto-assign-goalkeepers")]
    public async Task<IActionResult> AutoAssignGoalkeepers(long matchDayId)
    {
        var result = await teamService.AutoAssignGoalkeepersAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, result);
    }

    /// <summary>Names a captain for every team on this MatchDay that doesn't already have one,
    /// drawn at random from the club's senior pool (see CaptainSelector). Never replaces a captain
    /// an organiser has already chosen, so re-running it only ever fills gaps.</summary>
    [HttpPost("matchday/{matchDayId}/auto-assign-captains")]
    public async Task<IActionResult> AutoAssignCaptains(long matchDayId)
    {
        var result = await teamService.AutoAssignCaptainsAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, result);
    }

    /// <summary>Bulk-undo for AutoAssignGoalkeepers - every team's current goalkeeper (if any) goes
    /// back to UNASSIGNED, so the ranking can be re-run from a clean slate.</summary>
    [HttpPost("matchday/{matchDayId}/clear-goalkeepers")]
    public async Task<IActionResult> ClearGoalkeepers(long matchDayId)
    {
        var result = await teamService.ClearGoalkeepersAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, result);
    }

    /// <summary>Read-only: the same per-team ranking auto-assign acts on (played/in goal/balance/
    /// status, ranked, NEXT UP marked) - lets the UI show the club's "Whose turn in goal" table
    /// before committing to an assignment.</summary>
    [HttpGet("matchday/{matchDayId}/goalkeeper-ranking")]
    public async Task<IActionResult> GetGoalkeeperRanking(long matchDayId)
    {
        var result = await teamService.GetGoalkeeperRankingAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, result);
    }

    /// <summary>"Declare Teams" button on Team Building - emails every confirmed participant the
    /// line-ups and the schedule as two inline images. Manual only, never fired automatically off
    /// generation. Pass testEmail in the body to send the identical mail to one address instead,
    /// which creates no in-app notifications.</summary>
    [HttpPost("matchday/{matchDayId}/declare-teams")]
    public async Task<IActionResult> DeclareTeams(long matchDayId, [FromBody] DeclareTeamsRequest request)
    {
        var result = await teamService.DeclareTeamsAsync(matchDayId, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, result);
    }

    /// <summary>"Send Match Day Reminder" button on Team Building - manually triggers the same
    /// reminder email the hourly scheduler sends automatically, right now, for this one MatchDay.</summary>
    [HttpPost("matchday/{matchDayId}/send-reminder-email")]
    public async Task<IActionResult> SendMatchDayReminder(long matchDayId)
    {
        var sent = await teamService.SendMatchDayReminderNowAsync(matchDayId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk, new { sent });
    }
}
