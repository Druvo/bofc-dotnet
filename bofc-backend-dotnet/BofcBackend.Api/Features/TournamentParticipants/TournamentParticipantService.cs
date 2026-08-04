using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Players;
using BofcBackend.Api.Features.TournamentParticipants.Models;
using BofcBackend.Api.Features.Tournaments;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.TournamentParticipants;

/// <summary>Port of service/TournamentParticipantServiceImpl.java.</summary>
public class TournamentParticipantService(
    BofcDbContext db,
    ICurrentUserService currentUser,
    ITournamentService tournamentService,
    IPlayerService playerService) : ITournamentParticipantService
{
    public async Task SaveOrUpdateTournamentParticipantAsync(TournamentParticipantRequest request)
    {
        var playerId = request.PlayerId!.Value;
        if (!currentUser.IsUserAuthorizedForSelf(playerId)
            && !currentUser.IsInRole(PlayerRoleNames.Admin) && !currentUser.IsInRole(PlayerRoleNames.SuperAdmin))
        {
            // Java calls `throw new SecurityException(UNAUTHORIZED)` with a single argument —
            // only compiles against java.lang.SecurityException (the app's own SecurityException
            // requires message+HttpStatus), so this is the same likely-accidental wrong-class
            // import as PlayerServiceImpl.updatePlayer. Using BofcSecurityException for a real
            // 403 instead of reproducing what would be an unhandled 500 in Java.
            throw new BofcSecurityException(RestErrorMessageDetail.NotAuthorizedForAction, HttpStatusCode.Forbidden);
        }

        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == request.TournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);
        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == playerId)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

        if (tournament.TournamentDate < DateTime.UtcNow)
        {
            throw new TournamentServiceException(RestErrorMessageDetail.TournamentDateCannotBePastDate, HttpStatusCode.BadRequest);
        }

        TournamentParticipant participant;
        if (request.TournamentParticipantId != null)
        {
            participant = await db.TournamentParticipants.FirstOrDefaultAsync(p => p.Id == request.TournamentParticipantId)
                ?? throw new TournamentServiceException(RestErrorMessageDetail.ParticipantNotFound, HttpStatusCode.NotFound);
        }
        else
        {
            if (await db.TournamentParticipants.AnyAsync(p => p.TournamentId == tournament.Id && p.PlayerId == playerId))
            {
                throw new TournamentServiceException(RestErrorMessageDetail.AlreadyParticipant, HttpStatusCode.Conflict);
            }
            participant = new TournamentParticipant();
            db.TournamentParticipants.Add(participant);
        }

        participant.TournamentId = tournament.Id;
        participant.PlayerId = player.Id;
        participant.ParticipationStatus = request.ParticipationStatus;
        participant.Comments = StringUtils.NormalizeString(request.Comments);

        await db.SaveChangesAsync();
    }

    public async Task<List<PlayerParticipationResponse>> PlayersToBeSelectedForTeamAsync(long tournamentId)
    {
        var participants = await db.TournamentParticipants.Include(p => p.Player)
            .Where(p => p.TournamentId == tournamentId && p.ParticipationStatus)
            .ToListAsync();

        var teamIds = await db.Teams.Where(t => t.TournamentId == tournamentId).Select(t => t.Id).ToListAsync();

        var result = new List<PlayerParticipationResponse>();
        foreach (var participant in participants)
        {
            var isAssigned = await db.TeamPlayers.AnyAsync(tp => teamIds.Contains(tp.TeamId) && tp.PlayerId == participant.PlayerId);
            if (!isAssigned)
            {
                result.Add(new PlayerParticipationResponse
                {
                    PlayerId = participant.Player.Id,
                    PlayerName = participant.Player.Name,
                    EmployeeId = participant.Player.EmployeeId,
                    ParticipationStatus = participant.ParticipationStatus,
                    Comments = participant.Comments,
                });
            }
        }
        return result;
    }

    public async Task<List<GoalkeeperStatsResponse>> GoalkeeperStatsResponseAsync(long tournamentId)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);

        var teamIds = await db.Teams.Where(t => t.TournamentId == tournament.Id).Select(t => t.Id).ToListAsync();
        var playerIds = await db.TournamentParticipants
            .Where(p => p.TournamentId == tournamentId && p.ParticipationStatus)
            .Select(p => p.PlayerId).ToListAsync();

        // For each candidate player, count how many times they've played goalkeeper for teams
        // NOT in the excluded list (i.e. teams already formed for this tournament) — fewer =
        // higher priority for a new goalkeeper assignment.
        return await db.Players.Where(p => playerIds.Contains(p.Id))
            .Select(p => new GoalkeeperStatsResponse
            {
                PlayerId = p.Id,
                PlayerName = p.Name,
                GoalkeeperCount = db.TeamPlayers.Count(tp =>
                    tp.PlayerId == p.Id && tp.PlayingPosition == FootballPosition.GOALKEEPER && !teamIds.Contains(tp.TeamId)),
            })
            .OrderBy(r => r.GoalkeeperCount)
            .ToListAsync();
    }

    public async Task<LatestTournamentWithParticipantsResponse> GetLatestTournamentWithParticipantsAsync()
    {
        var latestTournament = await tournamentService.GetMostRecentTournamentAsync();
        var totalPlayers = await playerService.CountActivePlayersAsync();
        var totalParticipants = await db.TournamentParticipants
            .CountAsync(p => p.TournamentId == latestTournament.Id && p.ParticipationStatus);

        return new LatestTournamentWithParticipantsResponse
        {
            Tournament = latestTournament,
            TotalParticipant = totalParticipants,
            TotalPlayer = totalPlayers,
            RemainParticipant = totalPlayers - totalParticipants,
        };
    }

    public async Task<LatestTournamentWithUserParticipantsResponse?> GetLatestTournamentWithUserStatusAsync()
    {
        var latestTournament = await tournamentService.GetMostRecentActiveTournamentAsync();
        if (latestTournament == null)
        {
            return null;
        }

        var totalPlayers = await playerService.CountActivePlayersAsync();
        var totalParticipants = await db.TournamentParticipants
            .CountAsync(p => p.TournamentId == latestTournament.Id && p.ParticipationStatus);

        var loggedInPlayerId = currentUser.GetPlayerId();
        var participantPlayer = await db.TournamentParticipantPlayers
            .FirstOrDefaultAsync(p => p.TournamentId == latestTournament.Id && p.PlayerId == loggedInPlayerId);

        var isUserParticipated = participantPlayer?.ParticipationStatus == true;
        var tournamentParticipantId = participantPlayer?.TournamentParticipantId;

        return new LatestTournamentWithUserParticipantsResponse
        {
            Tournament = latestTournament,
            TotalParticipant = totalParticipants,
            TotalPlayer = totalPlayers,
            RemainParticipant = totalPlayers - totalParticipants,
            IsUserParticipated = isUserParticipated,
            TournamentParticipantId = tournamentParticipantId,
        };
    }
}
