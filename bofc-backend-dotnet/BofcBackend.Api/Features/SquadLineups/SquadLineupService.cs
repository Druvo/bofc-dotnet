using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.SquadLineups.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.SquadLineups;

public class SquadLineupService(BofcDbContext db) : ISquadLineupService
{
    public async Task<TeamLineupResponse> GetLineupAsync(long teamId)
    {
        var team = await GetTeamWithRosterAsync(teamId);

        var lineup = await db.TeamLineups
            .Include(l => l.LineupPlayers)
            .FirstOrDefaultAsync(l => l.TeamId == teamId);

        if (lineup == null)
        {
            return new TeamLineupResponse { TeamId = teamId };
        }

        return ToResponse(lineup, team);
    }

    public async Task<TeamLineupResponse> UpdateLineupAsync(long teamId, UpdateTeamLineupRequest request)
    {
        var team = await GetTeamWithRosterAsync(teamId);
        var rosterPlayerIds = team.TeamPlayers.Select(tp => tp.PlayerId).ToHashSet();

        var submitted = request.Starters.Concat(request.Bench).ToList();
        foreach (var entry in submitted)
        {
            if (!rosterPlayerIds.Contains(entry.PlayerId!.Value))
            {
                throw new TeamServiceException(
                    $"Player {entry.PlayerId} is not on this team's roster", HttpStatusCode.BadRequest);
            }
        }

        var lineup = await db.TeamLineups
            .Include(l => l.LineupPlayers)
            .FirstOrDefaultAsync(l => l.TeamId == teamId);

        await using var transaction = await db.Database.BeginTransactionAsync();

        if (lineup == null)
        {
            lineup = new TeamLineup { TeamId = teamId, Team = team };
            db.TeamLineups.Add(lineup);
        }
        else
        {
            db.TeamLineupPlayers.RemoveRange(lineup.LineupPlayers);
            lineup.LineupPlayers.Clear();
        }

        lineup.SquadSize = request.SquadSize!.Value;
        lineup.Formation = request.Formation!.Trim();

        AddLineupPlayers(lineup, request.Starters, isStarter: true);
        AddLineupPlayers(lineup, request.Bench, isStarter: false);

        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        return ToResponse(lineup, team);
    }

    private static void AddLineupPlayers(TeamLineup lineup, List<LineupPlayerRequest> entries, bool isStarter)
    {
        for (var i = 0; i < entries.Count; i++)
        {
            var availability = Enum.TryParse<PlayerAvailability>(entries[i].Availability, out var parsed)
                ? parsed
                : PlayerAvailability.FIT;

            lineup.LineupPlayers.Add(new TeamLineupPlayer
            {
                PlayerId = entries[i].PlayerId!.Value,
                IsStarter = isStarter,
                OrderIndex = i,
                Availability = availability,
            });
        }
    }

    private async Task<Team> GetTeamWithRosterAsync(long teamId) =>
        await db.Teams.Include(t => t.TeamPlayers).ThenInclude(tp => tp.Player)
            .FirstOrDefaultAsync(t => t.Id == teamId)
        ?? throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);

    private static TeamLineupResponse ToResponse(TeamLineup lineup, Team team)
    {
        var positionByPlayerId = team.TeamPlayers.ToDictionary(tp => tp.PlayerId, tp => tp);

        LineupPlayerResponse ToPlayerResponse(TeamLineupPlayer lp)
        {
            var teamPlayer = positionByPlayerId.GetValueOrDefault(lp.PlayerId);
            return new LineupPlayerResponse
            {
                PlayerId = lp.PlayerId,
                PlayerName = teamPlayer?.Player.Name ?? string.Empty,
                PlayingPosition = teamPlayer?.PlayingPosition.ToString() ?? FootballPosition.UNASSIGNED.ToString(),
                Availability = lp.Availability.ToString(),
            };
        }

        return new TeamLineupResponse
        {
            TeamId = lineup.TeamId,
            SquadSize = lineup.SquadSize,
            Formation = lineup.Formation,
            Starters = lineup.LineupPlayers.Where(lp => lp.IsStarter).OrderBy(lp => lp.OrderIndex).Select(ToPlayerResponse).ToList(),
            Bench = lineup.LineupPlayers.Where(lp => !lp.IsStarter).OrderBy(lp => lp.OrderIndex).Select(ToPlayerResponse).ToList(),
        };
    }
}
