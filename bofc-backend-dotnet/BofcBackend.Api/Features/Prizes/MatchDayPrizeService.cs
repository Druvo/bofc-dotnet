using System.Net;
using System.Text.Json;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Prizes.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Prizes;

/// <summary>Port of service/MatchDayPrizeServiceImpl.java.</summary>
public class MatchDayPrizeService(BofcDbContext db) : IMatchDayPrizeService
{
    public async Task<MatchDayPrizeResponse> CreatePrizeAsync(MatchDayPrizeRequest request)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == request.MatchDayId)
            ?? throw new PlayerServiceException($"MatchDay not found with ID: {request.MatchDayId}", HttpStatusCode.NotFound);

        ValidatePrizeRequest(request);
        await CheckDuplicatePrizeAsync(request);

        var prize = new MatchDayPrize
        {
            MatchDayId = matchDay.Id,
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

        db.MatchDayPrizes.Add(prize);
        await db.SaveChangesAsync();
        return await ToResponseAsync(prize);
    }

    public async Task<MatchDayPrizeResponse> UpdatePrizeAsync(long prizeId, MatchDayPrizeRequest request)
    {
        var prize = await db.MatchDayPrizes.FirstOrDefaultAsync(p => p.Id == prizeId)
            ?? throw new PlayerServiceException($"Prize not found with ID: {prizeId}", HttpStatusCode.NotFound);
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == request.MatchDayId)
            ?? throw new PlayerServiceException($"MatchDay not found with ID: {request.MatchDayId}", HttpStatusCode.NotFound);

        ValidatePrizeRequest(request);

        prize.MatchDayId = matchDay.Id;
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
        var prize = await db.MatchDayPrizes.FirstOrDefaultAsync(p => p.Id == prizeId)
            ?? throw new PlayerServiceException($"Prize not found with ID: {prizeId}", HttpStatusCode.NotFound);
        db.MatchDayPrizes.Remove(prize);
        await db.SaveChangesAsync();
    }

    public async Task<MatchDayPrizeResponse> GetPrizeByIdAsync(long prizeId)
    {
        var prize = await db.MatchDayPrizes.FirstOrDefaultAsync(p => p.Id == prizeId)
            ?? throw new PlayerServiceException($"Prize not found with ID: {prizeId}", HttpStatusCode.NotFound);
        return await ToResponseAsync(prize);
    }

    public async Task<List<MatchDayPrizeResponse>> GetAllPrizesByMatchDayAsync(long matchDayId)
    {
        var prizes = await db.MatchDayPrizes.Where(p => p.MatchDayId == matchDayId)
            .OrderBy(p => p.PositionRank).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    public async Task<List<MatchDayPrizeResponse>> GetPrizesByMatchDayAndTypeAsync(long matchDayId, PrizeType prizeType)
    {
        var prizes = await db.MatchDayPrizes
            .Where(p => p.MatchDayId == matchDayId && p.PrizeType == prizeType)
            .OrderBy(p => p.PositionRank).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    public async Task<List<MatchDayPrizeResponse>> GetPrizesByTeamAsync(long matchDayId, long teamId)
    {
        var prizes = await db.MatchDayPrizes
            .Where(p => p.MatchDayId == matchDayId && p.TeamId == teamId).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    public async Task<List<MatchDayPrizeResponse>> GetPrizesByPlayerAsync(long matchDayId, long playerId)
    {
        var prizes = await db.MatchDayPrizes
            .Where(p => p.MatchDayId == matchDayId && p.PlayerId == playerId).ToListAsync();
        return await ToResponsesAsync(prizes);
    }

    // === Private helpers ===

    private static void ValidatePrizeRequest(MatchDayPrizeRequest request)
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

    private async Task CheckDuplicatePrizeAsync(MatchDayPrizeRequest request)
    {
        if (request.PrizeType == PrizeType.TEAM && request.TeamId != null)
        {
            var exists = await db.MatchDayPrizes.AnyAsync(p =>
                p.MatchDayId == request.MatchDayId && p.TeamId == request.TeamId && p.PrizeCategory == request.PrizeCategory);
            if (exists)
            {
                throw new PlayerServiceException("Prize already exists for this team and category", HttpStatusCode.Conflict);
            }
        }
        else if (request.PrizeType == PrizeType.PLAYER && request.PlayerId != null)
        {
            var exists = await db.MatchDayPrizes.AnyAsync(p =>
                p.MatchDayId == request.MatchDayId && p.PlayerId == request.PlayerId && p.PrizeCategory == request.PrizeCategory);
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

    private async Task<List<MatchDayPrizeResponse>> ToResponsesAsync(List<MatchDayPrize> prizes)
    {
        var responses = new List<MatchDayPrizeResponse>(prizes.Count);
        foreach (var prize in prizes)
        {
            responses.Add(await ToResponseAsync(prize));
        }
        return responses;
    }

    private async Task<MatchDayPrizeResponse> ToResponseAsync(MatchDayPrize prize)
    {
        var matchDay = await db.MatchDays.FirstAsync(t => t.Id == prize.MatchDayId);
        var response = new MatchDayPrizeResponse
        {
            Id = prize.Id,
            MatchDayId = matchDay.Id,
            MatchDayName = matchDay.Name,
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
