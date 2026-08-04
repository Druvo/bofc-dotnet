using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of service/auction/TeamBudgetServiceImpl.java.</summary>
public class TeamBudgetService(BofcDbContext db)
{
    public async Task<List<TeamBudgetResponse>> GetTeamBudgetsAsync(long tournamentId)
    {
        var budgets = await LoadQuery().Where(b => b.TournamentId == tournamentId).ToListAsync();
        return budgets.Select(MapToResponse).ToList();
    }

    public async Task<TeamBudgetResponse> CreateTeamBudgetAsync(long tournamentId, TeamBudgetRequest request)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new ResourceNotFoundException($"Tournament not found: {tournamentId}");

        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId)
            ?? throw new ResourceNotFoundException($"Team not found: {request.TeamId}");

        var owner = await db.Players.FirstOrDefaultAsync(p => p.Id == request.OwnerId)
            ?? throw new ResourceNotFoundException($"Owner not found: {request.OwnerId}");

        if (await db.TeamBudgets.AnyAsync(b => b.TournamentId == tournamentId && b.TeamId == request.TeamId))
        {
            throw new InvalidOperationException("Budget already exists for this team in this tournament");
        }

        var budget = new TeamBudget
        {
            TournamentId = tournament.Id,
            TeamId = team.Id,
            OwnerId = owner.Id,
            TotalBudget = request.TotalBudget!.Value,
            RemainingBudget = request.TotalBudget.Value,
            TotalSpent = 0,
            PlayersBought = 0,
        };

        db.TeamBudgets.Add(budget);
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(budget.Id);
    }

    public async Task<TeamBudgetResponse> UpdateTeamBudgetAsync(long tournamentId, long id, TeamBudgetRequest request)
    {
        var budget = await db.TeamBudgets.FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new ResourceNotFoundException($"Team budget not found: {id}");

        if (budget.TournamentId != tournamentId)
        {
            throw new InvalidOperationException("Budget does not belong to this tournament");
        }

        if (request.TotalBudget != null)
        {
            var difference = request.TotalBudget.Value - budget.TotalBudget;
            budget.TotalBudget = request.TotalBudget.Value;
            budget.RemainingBudget += difference;
        }

        if (request.OwnerId != null)
        {
            var owner = await db.Players.FirstOrDefaultAsync(p => p.Id == request.OwnerId)
                ?? throw new ResourceNotFoundException($"Owner not found: {request.OwnerId}");
            budget.OwnerId = owner.Id;
        }

        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(budget.Id);
    }

    public async Task DeleteTeamBudgetAsync(long tournamentId, long id)
    {
        var budget = await db.TeamBudgets.FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new ResourceNotFoundException($"Team budget not found: {id}");

        if (budget.TournamentId != tournamentId)
        {
            throw new InvalidOperationException("Budget does not belong to this tournament");
        }

        if (budget.PlayersBought > 0)
        {
            throw new InvalidOperationException("Cannot delete a team budget with players already bought");
        }

        db.TeamBudgets.Remove(budget);
        await db.SaveChangesAsync();
    }

    private async Task<TeamBudgetResponse> MapToResponseByIdAsync(long id) =>
        MapToResponse(await LoadQuery().FirstAsync(b => b.Id == id));

    private IQueryable<TeamBudget> LoadQuery() => db.TeamBudgets.Include(b => b.Team).Include(b => b.Owner);

    public static TeamBudgetResponse MapToResponse(TeamBudget budget) => new()
    {
        Id = budget.Id,
        TournamentId = budget.TournamentId,
        TeamId = budget.Team.Id,
        TeamName = budget.Team.TeamName,
        OwnerId = budget.Owner.Id,
        OwnerName = budget.Owner.Name,
        TotalBudget = budget.TotalBudget,
        RemainingBudget = budget.RemainingBudget,
        TotalSpent = budget.TotalSpent,
        PlayersBought = budget.PlayersBought,
    };
}
