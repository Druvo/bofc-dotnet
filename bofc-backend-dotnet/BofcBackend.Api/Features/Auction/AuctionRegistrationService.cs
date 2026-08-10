using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BofcBackend.Api.Features.Auction;

/// <summary>Port of service/auction/AuctionRegistrationServiceImpl.java.</summary>
public class AuctionRegistrationService(
    BofcDbContext db,
    ICurrentUserService currentUserService,
    IOptions<PlayerOptions> playerOptions)
{
    public async Task<AuctionRegistrationResponse> RegisterAsync(AuctionRegistrationRequest request)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == request.MatchDayId)
            ?? throw new ResourceNotFoundException($"MatchDay not found: {request.MatchDayId}");

        if (!matchDay.AuctionMode)
        {
            throw new InvalidOperationException("MatchDay is not in auction mode");
        }

        await EnsureRegistrationOpenAsync(request.MatchDayId!.Value);

        if (await db.AuctionPlayerRegistrations.AnyAsync(r => r.Email == request.Email && r.MatchDayId == request.MatchDayId))
        {
            throw new InvalidOperationException("Already registered with this email for this MatchDay");
        }

        if (await db.AuctionPlayerRegistrations.AnyAsync(r => r.EmployeeId == request.EmployeeId && r.MatchDayId == request.MatchDayId))
        {
            throw new InvalidOperationException("Already registered with this employee ID for this MatchDay");
        }

        var registration = new AuctionPlayerRegistration
        {
            MatchDayId = matchDay.Id,
            Name = request.Name!,
            Email = request.Email!,
            EmployeeId = request.EmployeeId!,
            TeamsId = request.TeamsId,
            MobileNo = request.MobileNo,
            PlayingPosition = request.PlayingPosition!.Value,
            BattingStyle = request.BattingStyle,
            BowlingStyle = request.BowlingStyle,
            PreviousExperience = request.PreviousExperience,
            AvailabilityStatus = request.AvailabilityStatus ?? AvailabilityStatus.AVAILABLE,
            ProfilePhoto = request.ProfilePhoto,
            EmergencyContact = request.EmergencyContact,
            PreferredBasePrice = request.PreferredBasePrice,
            ApprovalStatus = ApprovalStatus.PENDING,
        };

        db.AuctionPlayerRegistrations.Add(registration);
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(registration.Id);
    }

    public async Task<AuctionRegistrationResponse> QuickRegisterExistingPlayerAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new ResourceNotFoundException($"MatchDay not found: {matchDayId}");

        if (!matchDay.AuctionMode)
        {
            throw new InvalidOperationException("MatchDay is not in auction mode");
        }

        await EnsureRegistrationOpenAsync(matchDayId);

        var currentUserId = currentUserService.GetPlayerId();
        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == currentUserId)
            ?? throw new ResourceNotFoundException("Player not found");

        if (await db.AuctionPlayerRegistrations.AnyAsync(r => r.Email == player.Email && r.MatchDayId == matchDayId))
        {
            throw new InvalidOperationException("You are already registered for this auction");
        }

        var registration = new AuctionPlayerRegistration
        {
            MatchDayId = matchDay.Id,
            Name = player.Name,
            Email = player.Email,
            EmployeeId = player.EmployeeId,
            TeamsId = player.TeamsId,
            MobileNo = player.MobileNo,
            PlayingPosition = player.Position,
            ProfilePhoto = player.ProfilePhoto,
            AvailabilityStatus = AvailabilityStatus.AVAILABLE,
            ApprovalStatus = ApprovalStatus.APPROVED,
            ApprovedAt = DateTime.Now,
            CreatedPlayerId = player.Id,
        };

        db.AuctionPlayerRegistrations.Add(registration);
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(registration.Id);
    }

    private async Task EnsureRegistrationOpenAsync(long matchDayId)
    {
        var session = await db.AuctionSessions.FirstOrDefaultAsync(s => s.MatchDayId == matchDayId);
        if (session?.Status == AuctionSessionStatus.COMPLETED)
        {
            throw new InvalidOperationException("Auction registration is closed for this MatchDay");
        }
    }

    public async Task<List<AuctionRegistrationResponse>> GetRegistrationsAsync(long? matchDayId, string? status)
    {
        var query = LoadQuery();

        if (matchDayId != null && status != null)
        {
            var approvalStatus = Enum.Parse<ApprovalStatus>(status);
            query = query.Where(r => r.MatchDayId == matchDayId && r.ApprovalStatus == approvalStatus);
        }
        else if (matchDayId != null)
        {
            query = query.Where(r => r.MatchDayId == matchDayId);
        }
        else if (status != null)
        {
            var approvalStatus = Enum.Parse<ApprovalStatus>(status);
            query = query.Where(r => r.ApprovalStatus == approvalStatus);
        }

        var registrations = await query.ToListAsync();
        var responses = new List<AuctionRegistrationResponse>();
        foreach (var r in registrations)
        {
            responses.Add(await MapToResponseAsync(r));
        }

        return responses;
    }

    public async Task<AuctionRegistrationResponse> GetRegistrationAsync(long id) => await MapToResponseByIdAsync(id);

    public async Task<AuctionRegistrationResponse> ApproveAsync(long id)
    {
        var registration = await LoadQuery().FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new ResourceNotFoundException($"Registration not found: {id}");

        if (registration.ApprovalStatus != ApprovalStatus.PENDING)
        {
            throw new InvalidOperationException("Registration is not in pending state");
        }

        var currentUserId = currentUserService.GetPlayerId();
        var approver = await db.Players.FirstOrDefaultAsync(p => p.Id == currentUserId)
            ?? throw new ResourceNotFoundException("Current user not found");

        // Transaction: creating the player account (if needed) and approving the registration
        // must succeed together - otherwise a failure here leaves a real, active login account
        // permanently orphaned with no registration ever linked to it.
        await using var transaction = await db.Database.BeginTransactionAsync();

        var createdPlayer = await EnsurePlayerRecordAsync(registration);

        registration.ApprovalStatus = ApprovalStatus.APPROVED;
        registration.ApprovedById = approver.Id;
        registration.ApprovedAt = DateTime.Now;
        registration.CreatedPlayerId = createdPlayer.Id;

        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        return await MapToResponseAsync(registration);
    }

    public async Task<AuctionRegistrationResponse> RejectAsync(long id, string? reason)
    {
        var registration = await db.AuctionPlayerRegistrations.FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new ResourceNotFoundException($"Registration not found: {id}");

        if (registration.ApprovalStatus != ApprovalStatus.PENDING)
        {
            throw new InvalidOperationException("Registration is not in pending state");
        }

        registration.ApprovalStatus = ApprovalStatus.REJECTED;
        registration.RejectionReason = reason;
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(id);
    }

    public async Task<AuctionRegistrationResponse> UndoRejectAsync(long id)
    {
        var registration = await db.AuctionPlayerRegistrations.FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new ResourceNotFoundException($"Registration not found: {id}");

        if (registration.ApprovalStatus != ApprovalStatus.REJECTED)
        {
            throw new InvalidOperationException("Registration is not rejected");
        }

        registration.ApprovalStatus = ApprovalStatus.PENDING;
        registration.RejectionReason = null;
        await db.SaveChangesAsync();
        return await MapToResponseByIdAsync(id);
    }

    public async Task<AuctionRegistrationResponse> ApproveAndAddToPoolAsync(long id, AuctionPlayerCategory? category, int? basePrice)
    {
        if (basePrice == null || basePrice < 1)
        {
            throw new InvalidOperationException("basePrice is required and must be at least 1");
        }

        var registration = await db.AuctionPlayerRegistrations.Include(r => r.CreatedPlayer)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new ResourceNotFoundException($"Registration not found: {id}");

        var matchDayId = registration.MatchDayId;

        if (registration.ApprovalStatus == ApprovalStatus.REJECTED)
        {
            throw new InvalidOperationException("Rejected registrations cannot be added to pool");
        }

        // Transaction: approving the registration (which may create a real player account),
        // and adding that player to the auction pool, must succeed together - otherwise a
        // failure partway through leaves an orphaned player account or an approved
        // registration that never actually made it into the pool.
        await using var transaction = await db.Database.BeginTransactionAsync();

        if (registration.ApprovalStatus == ApprovalStatus.PENDING)
        {
            var currentUserId = currentUserService.GetPlayerId();
            var approver = await db.Players.FirstOrDefaultAsync(p => p.Id == currentUserId)
                ?? throw new ResourceNotFoundException("Current user not found");

            var createdPlayer = await EnsurePlayerRecordAsync(registration);

            registration.ApprovalStatus = ApprovalStatus.APPROVED;
            registration.ApprovedById = approver.Id;
            registration.ApprovedAt = DateTime.Now;
            registration.CreatedPlayerId = createdPlayer.Id;
            registration.CreatedPlayer = createdPlayer;
            await db.SaveChangesAsync();
        }

        var player = registration.CreatedPlayer
            ?? throw new InvalidOperationException("No player record found for this registration");

        if (!await db.AuctionPlayers.AnyAsync(p => p.MatchDayId == matchDayId && p.PlayerId == player.Id))
        {
            // Java: playerType = registration.getApprovedBy() != null ? OUTSIDE : EXISTING - replicated
            // as-is even though this reads oddly (ApprovedBy is set on nearly every approval path).
            var playerType = registration.ApprovedById != null ? AuctionPlayerType.OUTSIDE : AuctionPlayerType.EXISTING;

            db.AuctionPlayers.Add(new AuctionPlayer
            {
                MatchDayId = matchDayId,
                PlayerId = player.Id,
                PlayerType = playerType,
                Category = category,
                BasePrice = basePrice.Value,
                Status = AuctionPlayerStatus.AVAILABLE,
                AuctionRound = 1,
            });
            await db.SaveChangesAsync();
        }

        await transaction.CommitAsync();

        return await MapToResponseAsync(registration);
    }

    private async Task<Player> EnsurePlayerRecordAsync(AuctionPlayerRegistration registration)
    {
        var existingPlayer = await db.Players.FirstOrDefaultAsync(p => p.Email == registration.Email);
        if (existingPlayer == null)
        {
            var outsidePlayerRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == PlayerRoleNames.OutsidePlayer)
                ?? throw new ResourceNotFoundException("OUTSIDE_PLAYER role not found");

            existingPlayer = new Player
            {
                Name = registration.Name,
                Email = registration.Email,
                EmployeeId = registration.EmployeeId,
                TeamsId = !string.IsNullOrEmpty(registration.TeamsId) ? registration.TeamsId : registration.EmployeeId,
                MobileNo = registration.MobileNo,
                Position = registration.PlayingPosition,
                ProfilePhoto = registration.ProfilePhoto,
                Password = BCrypt.Net.BCrypt.HashPassword(playerOptions.Value.DefaultPassword),
                IsActive = true,
                Roles = [outsidePlayerRole],
            };
            db.Players.Add(existingPlayer);
            await db.SaveChangesAsync();
        }
        else if (!string.IsNullOrWhiteSpace(registration.ProfilePhoto))
        {
            existingPlayer.ProfilePhoto = registration.ProfilePhoto;
            await db.SaveChangesAsync();
        }

        return existingPlayer;
    }

    private IQueryable<AuctionPlayerRegistration> LoadQuery() => db.AuctionPlayerRegistrations
        .Include(r => r.MatchDay)
        .Include(r => r.ApprovedBy)
        .Include(r => r.CreatedPlayer);

    private async Task<AuctionRegistrationResponse> MapToResponseByIdAsync(long id) =>
        await MapToResponseAsync(await LoadQuery().FirstAsync(r => r.Id == id));

    private async Task<AuctionRegistrationResponse> MapToResponseAsync(AuctionPlayerRegistration reg)
    {
        var createdPlayerId = reg.CreatedPlayer?.Id;
        var inPool = createdPlayerId != null && await db.AuctionPlayers.AnyAsync(
            p => p.MatchDayId == reg.MatchDayId && p.PlayerId == createdPlayerId && p.Status != AuctionPlayerStatus.WITHDRAWN);

        return new AuctionRegistrationResponse
        {
            Id = reg.Id,
            MatchDayId = reg.MatchDayId,
            MatchDayName = reg.MatchDay.Name,
            Name = reg.Name,
            Email = reg.Email,
            EmployeeId = reg.EmployeeId,
            TeamsId = reg.TeamsId,
            MobileNo = reg.MobileNo,
            PlayingPosition = reg.PlayingPosition,
            BattingStyle = reg.BattingStyle,
            BowlingStyle = reg.BowlingStyle,
            PreviousExperience = reg.PreviousExperience,
            AvailabilityStatus = reg.AvailabilityStatus,
            ProfilePhoto = reg.ProfilePhoto,
            EmergencyContact = reg.EmergencyContact,
            PreferredBasePrice = reg.PreferredBasePrice,
            ApprovalStatus = reg.ApprovalStatus,
            ApprovedByName = reg.ApprovedBy?.Name,
            ApprovedAt = reg.ApprovedAt,
            RejectionReason = reg.RejectionReason,
            CreatedDate = reg.CreatedDate,
            CreatedPlayerId = createdPlayerId,
            InAuctionPool = inPool,
        };
    }
}
