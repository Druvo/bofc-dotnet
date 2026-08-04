using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of service/auction/AuctionPlayerPoolServiceImpl.java.</summary>
public class AuctionPlayerPoolService(BofcDbContext db)
{
    public async Task<List<AuctionPlayerResponse>> GetPlayerPoolAsync(long tournamentId)
    {
        var players = await LoadQuery().Where(p => p.TournamentId == tournamentId)
            .OrderBy(p => p.SequenceOrder).ToListAsync();
        return players.Select(MapToResponse).ToList();
    }

    public async Task<AuctionPlayerResponse> AddExistingPlayerAsync(long tournamentId, AuctionPlayerRequest request)
    {
        if (request.PlayerId == null)
        {
            throw new InvalidOperationException("playerId is required when adding an existing player");
        }

        if (request.BasePrice == null)
        {
            throw new InvalidOperationException("basePrice is required");
        }

        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new ResourceNotFoundException($"Tournament not found: {tournamentId}");

        if (!tournament.AuctionMode)
        {
            throw new InvalidOperationException("Tournament is not in auction mode");
        }

        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == request.PlayerId)
            ?? throw new ResourceNotFoundException($"Player not found: {request.PlayerId}");

        if (await db.AuctionPlayers.AnyAsync(p => p.TournamentId == tournamentId && p.PlayerId == request.PlayerId))
        {
            throw new InvalidOperationException("Player already in auction pool for this tournament");
        }

        var auctionPlayer = new AuctionPlayer
        {
            TournamentId = tournament.Id,
            PlayerId = player.Id,
            PlayerType = AuctionPlayerType.EXISTING,
            Category = request.Category,
            BasePrice = request.BasePrice.Value,
            Status = AuctionPlayerStatus.AVAILABLE,
            AuctionRound = 1,
            SequenceOrder = request.SequenceOrder,
        };

        db.AuctionPlayers.Add(auctionPlayer);
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(auctionPlayer.Id);
    }

    public async Task<AuctionPlayerResponse> AddFromRegistrationAsync(long tournamentId, long registrationId, AuctionPlayerRequest request)
    {
        if (request.BasePrice == null)
        {
            throw new InvalidOperationException("basePrice is required");
        }

        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new ResourceNotFoundException($"Tournament not found: {tournamentId}");

        var registration = await db.AuctionPlayerRegistrations.Include(r => r.CreatedPlayer)
            .FirstOrDefaultAsync(r => r.Id == registrationId)
            ?? throw new ResourceNotFoundException($"Registration not found: {registrationId}");

        if (registration.ApprovalStatus != ApprovalStatus.APPROVED)
        {
            throw new InvalidOperationException("Registration is not approved");
        }

        if (registration.CreatedPlayer == null)
        {
            throw new InvalidOperationException("No player record created for this registration");
        }

        var player = registration.CreatedPlayer;

        if (await db.AuctionPlayers.AnyAsync(p => p.TournamentId == tournamentId && p.PlayerId == player.Id))
        {
            throw new InvalidOperationException("Player already in auction pool");
        }

        var auctionPlayer = new AuctionPlayer
        {
            TournamentId = tournament.Id,
            PlayerId = player.Id,
            PlayerType = AuctionPlayerType.OUTSIDE,
            Category = request.Category,
            BasePrice = request.BasePrice.Value,
            Status = AuctionPlayerStatus.AVAILABLE,
            AuctionRound = 1,
            SequenceOrder = request.SequenceOrder,
        };

        db.AuctionPlayers.Add(auctionPlayer);
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(auctionPlayer.Id);
    }

    public async Task<AuctionPlayerResponse> UpdatePlayerAsync(long tournamentId, long auctionPlayerId, AuctionPlayerRequest request)
    {
        var auctionPlayer = await db.AuctionPlayers.FirstOrDefaultAsync(p => p.Id == auctionPlayerId)
            ?? throw new ResourceNotFoundException($"Auction player not found: {auctionPlayerId}");

        if (auctionPlayer.TournamentId != tournamentId)
        {
            throw new InvalidOperationException("Player does not belong to this tournament");
        }

        if (auctionPlayer.Status == AuctionPlayerStatus.SOLD)
        {
            throw new InvalidOperationException("Cannot update a sold player");
        }

        if (request.BasePrice != null)
        {
            auctionPlayer.BasePrice = request.BasePrice.Value;
        }

        if (request.Category != null)
        {
            auctionPlayer.Category = request.Category;
        }

        if (request.SequenceOrder != null)
        {
            auctionPlayer.SequenceOrder = request.SequenceOrder;
        }

        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(auctionPlayer.Id);
    }

    public async Task RemovePlayerAsync(long tournamentId, long auctionPlayerId)
    {
        var auctionPlayer = await db.AuctionPlayers.FirstOrDefaultAsync(p => p.Id == auctionPlayerId)
            ?? throw new ResourceNotFoundException($"Auction player not found: {auctionPlayerId}");

        if (auctionPlayer.TournamentId != tournamentId)
        {
            throw new InvalidOperationException("Player does not belong to this tournament");
        }

        if (auctionPlayer.Status == AuctionPlayerStatus.SOLD)
        {
            throw new InvalidOperationException("Cannot remove a sold player");
        }

        auctionPlayer.Status = AuctionPlayerStatus.WITHDRAWN;
        await db.SaveChangesAsync();
    }

    public async Task<AuctionPlayerResponse> RestorePlayerAsync(long tournamentId, long auctionPlayerId)
    {
        var auctionPlayer = await db.AuctionPlayers.FirstOrDefaultAsync(p => p.Id == auctionPlayerId)
            ?? throw new ResourceNotFoundException($"Auction player not found: {auctionPlayerId}");

        if (auctionPlayer.TournamentId != tournamentId)
        {
            throw new InvalidOperationException("Player does not belong to this tournament");
        }

        if (auctionPlayer.Status != AuctionPlayerStatus.WITHDRAWN)
        {
            throw new InvalidOperationException("Only withdrawn players can be restored");
        }

        auctionPlayer.Status = AuctionPlayerStatus.AVAILABLE;
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(auctionPlayer.Id);
    }

    private async Task<AuctionPlayerResponse> MapToResponseByIdAsync(long id) =>
        MapToResponse(await LoadQuery().FirstAsync(p => p.Id == id));

    private IQueryable<AuctionPlayer> LoadQuery() => db.AuctionPlayers
        .Include(p => p.Player)
        .Include(p => p.CurrentHighestTeam)
        .Include(p => p.SoldToTeam);

    public static AuctionPlayerResponse MapToResponse(AuctionPlayer ap) => new()
    {
        Id = ap.Id,
        TournamentId = ap.TournamentId,
        PlayerId = ap.Player.Id,
        PlayerName = ap.Player.Name,
        PlayerEmail = ap.Player.Email,
        PhotoUrl = ap.Player.PhotoKey != null ? $"/files/player-photos/{ap.Player.PhotoKey}" : null,
        PlayingPosition = ap.Player.Position,
        PlayerType = ap.PlayerType,
        Category = ap.Category,
        BasePrice = ap.BasePrice,
        CurrentBid = ap.CurrentBid,
        CurrentHighestTeamId = ap.CurrentHighestTeam?.Id,
        CurrentHighestTeamName = ap.CurrentHighestTeam?.TeamName,
        SoldToTeamId = ap.SoldToTeam?.Id,
        SoldToTeamName = ap.SoldToTeam?.TeamName,
        FinalPrice = ap.FinalPrice,
        Status = ap.Status,
        AuctionRound = ap.AuctionRound,
        PlayerRating = ap.PlayerRating,
        SequenceOrder = ap.SequenceOrder,
    };
}
