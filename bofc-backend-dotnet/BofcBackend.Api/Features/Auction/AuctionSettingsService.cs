using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of service/auction/AuctionSettingsServiceImpl.java.</summary>
public class AuctionSettingsService(BofcDbContext db)
{
    public async Task<AuctionSettingsResponse?> GetSettingsAsync(long tournamentId)
    {
        var settings = await db.AuctionSettingsSet.FirstOrDefaultAsync(s => s.TournamentId == tournamentId);
        return settings == null ? null : MapToResponse(settings);
    }

    public async Task<AuctionSettingsResponse> CreateSettingsAsync(long tournamentId, AuctionSettingsRequest request)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new ResourceNotFoundException($"Tournament not found: {tournamentId}");

        if (await db.AuctionSettingsSet.AnyAsync(s => s.TournamentId == tournamentId))
        {
            throw new InvalidOperationException("Auction settings already exist for this tournament");
        }

        var settings = new AuctionSettings
        {
            TournamentId = tournament.Id,
            TeamBudget = request.TeamBudget!.Value,
            MinSquadSize = request.MinSquadSize!.Value,
            MaxSquadSize = request.MaxSquadSize!.Value,
            AuctionTimerSeconds = request.AuctionTimerSeconds!.Value,
            BidIncrement = request.BidIncrement!.Value,
            UnsoldReauctionEnabled = request.UnsoldReauctionEnabled ?? true,
            TimerExtensionSeconds = request.TimerExtensionSeconds ?? 15,
            ExtendIfBidWithinLastSeconds = request.ExtendIfBidWithinLastSeconds ?? 15,
            MinRoleRequirements = request.MinRoleRequirements,
            ScheduledStartTime = request.ScheduledStartTime,
            AuctionStatus = AuctionStatus.NOT_STARTED,
        };

        db.AuctionSettingsSet.Add(settings);
        await db.SaveChangesAsync();
        return MapToResponse(settings);
    }

    public async Task<AuctionSettingsResponse> UpdateSettingsAsync(long tournamentId, AuctionSettingsRequest request)
    {
        var settings = await db.AuctionSettingsSet.FirstOrDefaultAsync(s => s.TournamentId == tournamentId)
            ?? throw new ResourceNotFoundException($"Auction settings not found for tournament: {tournamentId}");

        settings.TeamBudget = request.TeamBudget!.Value;
        settings.MinSquadSize = request.MinSquadSize!.Value;
        settings.MaxSquadSize = request.MaxSquadSize!.Value;
        settings.AuctionTimerSeconds = request.AuctionTimerSeconds!.Value;
        settings.BidIncrement = request.BidIncrement!.Value;

        if (request.UnsoldReauctionEnabled != null)
        {
            settings.UnsoldReauctionEnabled = request.UnsoldReauctionEnabled.Value;
        }

        if (request.TimerExtensionSeconds != null)
        {
            settings.TimerExtensionSeconds = request.TimerExtensionSeconds.Value;
        }

        if (request.ExtendIfBidWithinLastSeconds != null)
        {
            settings.ExtendIfBidWithinLastSeconds = request.ExtendIfBidWithinLastSeconds.Value;
        }

        settings.MinRoleRequirements = request.MinRoleRequirements;
        settings.ScheduledStartTime = request.ScheduledStartTime;

        await db.SaveChangesAsync();
        return MapToResponse(settings);
    }

    private static AuctionSettingsResponse MapToResponse(AuctionSettings settings) => new()
    {
        Id = settings.Id,
        TournamentId = settings.TournamentId,
        TeamBudget = settings.TeamBudget,
        MinSquadSize = settings.MinSquadSize,
        MaxSquadSize = settings.MaxSquadSize,
        AuctionTimerSeconds = settings.AuctionTimerSeconds,
        BidIncrement = settings.BidIncrement,
        UnsoldReauctionEnabled = settings.UnsoldReauctionEnabled,
        TimerExtensionSeconds = settings.TimerExtensionSeconds,
        ExtendIfBidWithinLastSeconds = settings.ExtendIfBidWithinLastSeconds,
        MinRoleRequirements = settings.MinRoleRequirements,
        AuctionStatus = settings.AuctionStatus,
        ScheduledStartTime = settings.ScheduledStartTime,
    };
}
