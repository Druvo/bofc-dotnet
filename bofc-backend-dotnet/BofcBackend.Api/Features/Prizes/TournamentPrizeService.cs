using System.Net;
using System.Text.Json;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Prizes.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Prizes;

/// <summary>Port of service/TournamentPrizeServiceImpl.java.</summary>
public class TournamentPrizeService(BofcDbContext db) : ITournamentPrizeService
{
    public async Task<TournamentPrizeResponse> CreatePrizeAsync(TournamentPrizeRequest request)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == request.TournamentId)
            ?? throw new PlayerServiceException($"Tournament not found with ID: {request.TournamentId}", HttpStatusCode.NotFound);

        ValidatePrizeRequest(request);
        await CheckDuplicatePrizeAsync(request);

        var prize = new TournamentPrize
        {
            TournamentId = tournament.Id,
            PrizeType = request.PrizeType!.Value,
            PositionRank = request.PositionRank!.Value,
            PrizeAmount = request.PrizeAmount,
            PrizeCategory = request.PrizeCategory!.Value,
            Description = request.Description,
            ImageLinks = ConvertListToJson(request.ImageLinks),
        };

        if (request.PrizeType == PrizeType.TEAM)
        {
            var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId)
                ?? throw new PlayerServiceException($"Team not found with ID: {request.TeamId}", HttpStatusCode.NotFound);
            prize.TeamId = team.Id;
        }
        else
        {
            var player = await db.Players.FirstOrDefaultAsync(p => p.Id == request.PlayerId)
                ?? throw new PlayerServiceException($"Player not found with ID: {request.PlayerId}", HttpStatusCode.NotFound);
            prize.PlayerId = player.Id;
        }

        db.TournamentPrizes.Add(prize);
        await db.SaveChangesAsync();
        return await ToResponseAsync(prize);
    }

    public async Task<TournamentPrizeResponse> UpdatePrizeAsync(long prizeId, TournamentPrizeRequest request)
    {
        var prize = await db.TournamentPrizes.FirstOrDefaultAsync(p => p.Id == prizeId)
            ?? throw new PlayerServiceException($"Prize not found with ID: {prizeId}", HttpStatusCode.NotFound);
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == request.TournamentId)
            ?? throw new PlayerServiceException($"Tournament not found with ID: {request.TournamentId}", HttpStatusCode.NotFound);

        ValidatePrizeRequest(request);

        prize.TournamentId = tournament.Id;
        prize.PrizeType = request.PrizeType!.Value;
        prize.PositionRank = request.PositionRank!.Value;
        prize.PrizeAmount = request.PrizeAmount;
        prize.PrizeCategory = request.PrizeCategory!.Value;
        prize.Description = request.Description;
        prize.ImageLinks = ConvertListToJson(request.ImageLinks);

        if (request.PrizeType == PrizeType.TEAM)
        {
            var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId)
                ?? throw new PlayerServiceException($"Team not found with ID: {request.TeamId}", HttpStatusCode.NotFound);
            prize.TeamId = team.Id;
            prize.PlayerId = null;
        }
        else
        {
            var player = await db.Players.FirstOrDefaultAsync(p => p.Id == request.PlayerId)
                ?? throw new PlayerServiceException($"Player not found with ID: {request.PlayerId}", HttpStatusCode.NotFound);
            prize.PlayerId = player.Id;
            prize.TeamId = null;
        }

        await db.SaveChangesAsync();
        return await ToResponseAsync(prize);
    }

    public async Task DeletePrizeAsync(long prizeId)
    {
        var prize = await db.TournamentPrizes.FirstOrDefaultAsync(p => p.Id == prizeId)
            ?? throw new PlayerServiceException($"Prize not found with ID: {prizeId}", HttpStatusCode.NotFound);
        db.TournamentPrizes.Remove(prize);
        await db.SaveChangesAsync();
    }

    public async Task<TournamentPrizeResponse> GetPrizeByIdAsync(long prizeId)
    {
        var prize = await db.TournamentPrizes.FirstOrDefaultAsync(p => p.Id == prizeId)
            ?? throw new PlayerServiceException($"Prize not found with ID: {prizeId}", HttpStatusCode.NotFound);
        return await ToResponseAsync(prize);
    }

    public async Task<List<TournamentPrizeResponse>> GetAllPrizesByTournamentAsync(long tournamentId)
    {
        var prizes = await db.TournamentPrizes.Where(p => p.TournamentId == tournamentId)
            .OrderBy(p => p.PositionRank).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    public async Task<List<TournamentPrizeResponse>> GetPrizesByTournamentAndTypeAsync(long tournamentId, PrizeType prizeType)
    {
        var prizes = await db.TournamentPrizes
            .Where(p => p.TournamentId == tournamentId && p.PrizeType == prizeType)
            .OrderBy(p => p.PositionRank).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    public async Task<List<TournamentPrizeResponse>> GetPrizesByTeamAsync(long tournamentId, long teamId)
    {
        var prizes = await db.TournamentPrizes
            .Where(p => p.TournamentId == tournamentId && p.TeamId == teamId).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    public async Task<List<TournamentPrizeResponse>> GetPrizesByPlayerAsync(long tournamentId, long playerId)
    {
        var prizes = await db.TournamentPrizes
            .Where(p => p.TournamentId == tournamentId && p.PlayerId == playerId).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    // === Private helpers ===

    private static void ValidatePrizeRequest(TournamentPrizeRequest request)
    {
        if (request.PrizeType == PrizeType.TEAM)
        {
            if (request.TeamId == null)
            {
                throw new PlayerServiceException("Team ID is required for TEAM prize type", HttpStatusCode.BadRequest);
            }
            if (request.PlayerId != null)
            {
                throw new PlayerServiceException("Player ID must be null for TEAM prize type", HttpStatusCode.BadRequest);
            }
        }
        else if (request.PrizeType == PrizeType.PLAYER)
        {
            if (request.PlayerId == null)
            {
                throw new PlayerServiceException("Player ID is required for PLAYER prize type", HttpStatusCode.BadRequest);
            }
            if (request.TeamId != null)
            {
                throw new PlayerServiceException("Team ID must be null for PLAYER prize type", HttpStatusCode.BadRequest);
            }
        }

        if (request.PositionRank is null or < 1)
        {
            throw new PlayerServiceException("Position rank must be at least 1", HttpStatusCode.BadRequest);
        }

        if (request.PrizeAmount is < 0)
        {
            throw new PlayerServiceException("Prize amount cannot be negative", HttpStatusCode.BadRequest);
        }
    }

    private async Task CheckDuplicatePrizeAsync(TournamentPrizeRequest request)
    {
        if (request.PrizeType == PrizeType.TEAM && request.TeamId != null)
        {
            var exists = await db.TournamentPrizes.AnyAsync(p =>
                p.TournamentId == request.TournamentId && p.TeamId == request.TeamId && p.PrizeCategory == request.PrizeCategory);
            if (exists)
            {
                throw new PlayerServiceException("Prize already exists for this team and category", HttpStatusCode.Conflict);
            }
        }
        else if (request.PrizeType == PrizeType.PLAYER && request.PlayerId != null)
        {
            var exists = await db.TournamentPrizes.AnyAsync(p =>
                p.TournamentId == request.TournamentId && p.PlayerId == request.PlayerId && p.PrizeCategory == request.PrizeCategory);
            if (exists)
            {
                throw new PlayerServiceException("Prize already exists for this player and category", HttpStatusCode.Conflict);
            }
        }
    }

    private static string? ConvertListToJson(List<string>? list) =>
        list == null || list.Count == 0 ? null : JsonSerializer.Serialize(list);

    private static List<string> ConvertJsonToList(string? json)
    {
        if (string.IsNullOrEmpty(json))
        {
            return [];
        }
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private async Task<List<TournamentPrizeResponse>> ToResponsesAsync(List<TournamentPrize> prizes)
    {
        var responses = new List<TournamentPrizeResponse>(prizes.Count);
        foreach (var prize in prizes)
        {
            responses.Add(await ToResponseAsync(prize));
        }
        return responses;
    }

    private async Task<TournamentPrizeResponse> ToResponseAsync(TournamentPrize prize)
    {
        var tournament = await db.Tournaments.FirstAsync(t => t.Id == prize.TournamentId);
        var response = new TournamentPrizeResponse
        {
            Id = prize.Id,
            TournamentId = tournament.Id,
            TournamentName = tournament.Name,
            PrizeType = prize.PrizeType,
            PositionRank = prize.PositionRank,
            PrizeAmount = prize.PrizeAmount,
            PrizeCategory = prize.PrizeCategory,
            Description = prize.Description,
            ImageLinks = ConvertJsonToList(prize.ImageLinks),
            CreatedDate = prize.CreatedDate,
            UpdatedDate = prize.UpdatedDate,
        };

        if (prize.TeamId != null)
        {
            var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == prize.TeamId);
            response.TeamId = team?.Id;
            response.TeamName = team?.TeamName;
        }

        if (prize.PlayerId != null)
        {
            var player = await db.Players.FirstOrDefaultAsync(p => p.Id == prize.PlayerId);
            response.PlayerId = player?.Id;
            response.PlayerName = player?.Name;
            response.PlayerEmployeeId = player?.EmployeeId;
        }

        return response;
    }
}
