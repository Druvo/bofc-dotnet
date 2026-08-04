using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Matches;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Statistics;

/// <summary>
/// Port of controller/StatisticsController.java. [AllowAnonymous] is applied per-action
/// (not at the controller level) because ASP.NET Core's AllowAnonymous always wins over
/// Authorize regardless of scope — a controller-level AllowAnonymous would silently disable
/// the auth gate on the one admin-only action (AggregateTournamentStatistics) below.
/// </summary>
[ApiController]
[Route("statistics")]
public class StatisticsController(IMatchStatisticsService matchStatisticsService, BofcDbContext db) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("tournaments/{tournamentId}/standings")]
    public async Task<IActionResult> GetTournamentStandings(long tournamentId)
    {
        var standings = await matchStatisticsService.GetTournamentStandingsAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, standings);
    }

    [AllowAnonymous]
    [HttpGet("tournaments/{tournamentId}/top-scorers")]
    public async Task<IActionResult> GetTopScorers(long tournamentId)
    {
        var topScorers = await matchStatisticsService.GetTopScorersByTournamentAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, topScorers);
    }

    [AllowAnonymous]
    [HttpGet("tournaments/{tournamentId}/top-assists")]
    public async Task<IActionResult> GetTopAssists(long tournamentId)
    {
        var topAssists = await matchStatisticsService.GetTopAssistProvidersByTournamentAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, topAssists);
    }

    [AllowAnonymous]
    [HttpGet("tournaments/{tournamentId}/top-cards")]
    public async Task<IActionResult> GetTopCards(long tournamentId)
    {
        var topCards = await matchStatisticsService.GetTopCardReceiversByTournamentAsync(tournamentId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, topCards);
    }

    [AllowAnonymous]
    [HttpGet("tournaments/{tournamentId}/players/{playerId}")]
    public async Task<IActionResult> GetPlayerTournamentStatistics(long tournamentId, long playerId)
    {
        var statistics = await matchStatisticsService.GetPlayerTournamentStatisticsAsync(tournamentId, playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, statistics);
    }

    [AllowAnonymous]
    [HttpGet("players/{playerId}/match-history")]
    public async Task<IActionResult> GetPlayerMatchHistory(long playerId)
    {
        var history = await matchStatisticsService.GetPlayerMatchHistoryAsync(playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, history);
    }

    [AllowAnonymous]
    [HttpGet("matches/{matchId}")]
    public async Task<IActionResult> GetMatchStatistics(long matchId)
    {
        var statistics = await matchStatisticsService.GetMatchStatisticsAsync(matchId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, statistics);
    }

    [AllowAnonymous]
    [HttpGet("matches/{matchId}/players/{playerId}")]
    public async Task<IActionResult> GetPlayerMatchStatistics(long matchId, long playerId)
    {
        var statistics = await matchStatisticsService.GetPlayerMatchStatisticsAsync(matchId, playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, statistics);
    }

    [AllowAnonymous]
    [HttpGet("matches/{matchId}/teams/{teamId}")]
    public async Task<IActionResult> GetTeamMatchStatistics(long matchId, long teamId)
    {
        var statistics = await matchStatisticsService.GetTeamMatchStatisticsAsync(matchId, teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, statistics);
    }

    [AllowAnonymous]
    [HttpGet("tournaments/{tournamentId}/teams/{teamId}/goals")]
    public async Task<IActionResult> GetTeamTotalGoals(long tournamentId, long teamId)
    {
        var totalGoals = await matchStatisticsService.GetTeamTotalGoalsInTournamentAsync(tournamentId, teamId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, totalGoals);
    }

    [AllowAnonymous]
    [HttpGet("tournaments/{tournamentId}/players/{playerId}/cards")]
    public async Task<IActionResult> GetPlayerTotalCards(long tournamentId, long playerId)
    {
        var totalCards = await matchStatisticsService.GetPlayerTotalDisciplinaryCardsInTournamentAsync(tournamentId, playerId);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, totalCards);
    }

    /// <summary>
    /// Utility endpoint to (re)process existing matches that don't have statistics yet.
    /// </summary>
    [Authorize(Roles = PlayerRoleNames.Admin + "," + PlayerRoleNames.SuperAdmin + "," + PlayerRoleNames.Coordinator)]
    [HttpPost("tournaments/{tournamentId}/aggregate")]
    public async Task<IActionResult> AggregateTournamentStatistics(long tournamentId)
    {
        var matchIds = await db.Matches.Where(m => m.TournamentId == tournamentId).Select(m => m.Id).ToListAsync();

        var successCount = 0;
        var errorCount = 0;
        foreach (var matchId in matchIds)
        {
            try
            {
                await matchStatisticsService.AggregateMatchStatisticsAsync(matchId);
                successCount++;
            }
            catch
            {
                errorCount++;
            }
        }

        var message = $"Aggregated statistics for {matchIds.Count} matches ({successCount} successful, {errorCount} failed)";
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, message);
    }
}
