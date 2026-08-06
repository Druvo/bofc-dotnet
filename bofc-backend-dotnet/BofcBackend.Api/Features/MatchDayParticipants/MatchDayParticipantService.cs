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
using BofcBackend.Api.Features.MatchDayParticipants.Models;
using BofcBackend.Api.Features.MatchDays;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.MatchDayParticipants;

/// <summary>Port of service/MatchDayParticipantServiceImpl.java.</summary>
public class MatchDayParticipantService(
    BofcDbContext db,
    ICurrentUserService currentUser,
    IMatchDayService matchDayService,
    IPlayerService playerService) : IMatchDayParticipantService
{
    public async Task SaveOrUpdateMatchDayParticipantAsync(MatchDayParticipantRequest request)
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

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == request.MatchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == playerId)
            ?? throw new PlayerServiceException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

        if (matchDay.MatchDayDate < DateTime.UtcNow)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayDateCannotBePastDate, HttpStatusCode.BadRequest);
        }

        MatchDayParticipant participant;
        if (request.MatchDayParticipantId != null)
        {
            participant = await db.MatchDayParticipants.FirstOrDefaultAsync(p => p.Id == request.MatchDayParticipantId)
                ?? throw new MatchDayServiceException(RestErrorMessageDetail.ParticipantNotFound, HttpStatusCode.NotFound);
        }
        else
        {
            if (await db.MatchDayParticipants.AnyAsync(p => p.MatchDayId == matchDay.Id && p.PlayerId == playerId))
            {
                throw new MatchDayServiceException(RestErrorMessageDetail.AlreadyParticipant, HttpStatusCode.Conflict);
            }
            participant = new MatchDayParticipant();
            db.MatchDayParticipants.Add(participant);
        }

        participant.MatchDayId = matchDay.Id;
        participant.PlayerId = player.Id;
        participant.ParticipationStatus = request.ParticipationStatus;
        participant.Comments = StringUtils.NormalizeString(request.Comments);

        await db.SaveChangesAsync();
    }

    public async Task<List<PlayerParticipationResponse>> PlayersToBeSelectedForTeamAsync(long matchDayId)
    {
        var participants = await db.MatchDayParticipants.Include(p => p.Player)
            .Where(p => p.MatchDayId == matchDayId && p.ParticipationStatus)
            .ToListAsync();

        var teamIds = await db.Teams.Where(t => t.MatchDayId == matchDayId).Select(t => t.Id).ToListAsync();

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

    public async Task<List<GoalkeeperStatsResponse>> GoalkeeperStatsResponseAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        var teamIds = await db.Teams.Where(t => t.MatchDayId == matchDay.Id).Select(t => t.Id).ToListAsync();
        var playerIds = await db.MatchDayParticipants
            .Where(p => p.MatchDayId == matchDayId && p.ParticipationStatus)
            .Select(p => p.PlayerId).ToListAsync();

        // For each candidate player, count how many times they've played goalkeeper for teams
        // NOT in the excluded list (i.e. teams already formed for this MatchDay) — fewer =
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

    public async Task<LatestMatchDayWithParticipantsResponse> GetLatestMatchDayWithParticipantsAsync()
    {
        var latestMatchDay = await matchDayService.GetMostRecentMatchDayAsync();
        var totalPlayers = await playerService.CountActivePlayersAsync();
        var totalParticipants = await db.MatchDayParticipants
            .CountAsync(p => p.MatchDayId == latestMatchDay.Id && p.ParticipationStatus);

        return new LatestMatchDayWithParticipantsResponse
        {
            MatchDay = latestMatchDay,
            TotalParticipant = totalParticipants,
            TotalPlayer = totalPlayers,
            RemainParticipant = totalPlayers - totalParticipants,
        };
    }

    public async Task<LatestMatchDayWithUserParticipantsResponse?> GetLatestMatchDayWithUserStatusAsync()
    {
        var latestMatchDay = await matchDayService.GetMostRecentActiveMatchDayAsync();
        if (latestMatchDay == null)
        {
            return null;
        }

        var totalPlayers = await playerService.CountActivePlayersAsync();
        var totalParticipants = await db.MatchDayParticipants
            .CountAsync(p => p.MatchDayId == latestMatchDay.Id && p.ParticipationStatus);

        var loggedInPlayerId = currentUser.GetPlayerId();
        var participantPlayer = await db.MatchDayParticipantPlayers
            .FirstOrDefaultAsync(p => p.MatchDayId == latestMatchDay.Id && p.PlayerId == loggedInPlayerId);

        var isUserParticipated = participantPlayer?.ParticipationStatus == true;
        var matchDayParticipantId = participantPlayer?.MatchDayParticipantId;

        return new LatestMatchDayWithUserParticipantsResponse
        {
            MatchDay = latestMatchDay,
            TotalParticipant = totalParticipants,
            TotalPlayer = totalPlayers,
            RemainParticipant = totalPlayers - totalParticipants,
            IsUserParticipated = isUserParticipated,
            MatchDayParticipantId = matchDayParticipantId,
        };
    }
}
