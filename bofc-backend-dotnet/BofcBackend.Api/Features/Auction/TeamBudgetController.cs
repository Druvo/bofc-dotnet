using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Auction.Models;
using BofcBackend.Api.Features.Teams;
using BofcBackend.Api.Features.Teams.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of controller/auction/TeamBudgetController.java — raw responses, no envelope.</summary>
[ApiController]
[Route("tournaments/{tournamentId}/auction/team-budgets")]
public class TeamBudgetController(TeamBudgetService teamBudgetService, BofcDbContext db, ITeamService teamService) : ControllerBase
{
    private const string AdminSuperAdmin = PlayerRoleNames.AdminOrSuperAdmin;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetTeamBudgets(long tournamentId) => Ok(await teamBudgetService.GetTeamBudgetsAsync(tournamentId));

    [AllowAnonymous]
    [HttpGet("available-teams")]
    public async Task<IActionResult> GetAvailableTeams(long tournamentId)
    {
        var teams = await db.Teams.Include(t => t.TeamPlayers).Where(t => t.TournamentId == tournamentId).ToListAsync();
        var response = teams.Select(t => new TeamResponse { TeamId = t.Id, TeamName = t.TeamName, TournamentId = tournamentId }).ToList();
        return Ok(response);
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost("create-team")]
    public async Task<IActionResult> CreateTeamForAuction(long tournamentId, [FromBody] TeamRequest request)
    {
        request.TournamentId = tournamentId;
        var team = await teamService.CreateOrUpdateTeamAsync(request);
        return StatusCode(StatusCodes.Status201Created, team);
    }

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> CreateTeamBudget(long tournamentId, [FromBody] TeamBudgetRequest request) =>
        StatusCode(StatusCodes.Status201Created, await teamBudgetService.CreateTeamBudgetAsync(tournamentId, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTeamBudget(long tournamentId, long id, [FromBody] TeamBudgetRequest request) =>
        Ok(await teamBudgetService.UpdateTeamBudgetAsync(tournamentId, id, request));

    [Authorize(Roles = AdminSuperAdmin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTeamBudget(long tournamentId, long id)
    {
        await teamBudgetService.DeleteTeamBudgetAsync(tournamentId, id);
        return NoContent();
    }
}
