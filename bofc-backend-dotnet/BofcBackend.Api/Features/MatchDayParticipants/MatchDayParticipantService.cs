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
        // COORDINATOR manages teams/lineup/fixtures/prizes for a MatchDay elsewhere in the app -
        // excluding it here (Admin/SuperAdmin only) was an arbitrary gap for editing another
        // player's RSVP on their behalf.
        if (!currentUser.IsUserAuthorizedForSelf(playerId)
            && !currentUser.IsInRole(PlayerRoleNames.Admin) && !currentUser.IsInRole(PlayerRoleNames.SuperAdmin)
            && !currentUser.IsInRole(PlayerRoleNames.Coordinator))
        {
            // Java calls `throw new SecurityException(UNAUTHORIZED)` with a single argument -
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

        // MatchDayDate is naive-local (Dhaka wall-clock, see MatchDay.cs) - compare against
        // DateTime.Now, not UtcNow, matching TeamService.ValidateMatchDayDateAsync's convention.
        // Comparing against UtcNow here previously let RSVPs happen up to ~6h after real kickoff.
        if (matchDay.MatchDayDate < DateTime.Now)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayDateCannotBePastDate, HttpStatusCode.BadRequest);
        }
        if (matchDay.MatchDayStatus == MatchDayStatus.CONCLUDED)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayAlreadyConcluded, HttpStatusCode.BadRequest);
        }

        // Both halves of the lock hang off VotingLockEnabled, so an admin turning the toggle off
        // reopens RSVPs even for a MatchDay whose teams are already drafted. Settings are loaded
        // before the teams check (they used to be loaded after it) precisely so the toggle can
        // gate it.
        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        if (settings is { VotingLockEnabled: true })
        {
            var teamsBuilt = await db.Teams.AnyAsync(t => t.MatchDayId == matchDay.Id);
            if (teamsBuilt)
            {
                // Distinct from the time-window message below: "teams are drafted" and "kickoff is
                // too close" are different problems with different remedies, and collapsing them
                // into one message is what made the toggle look broken.
                throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayTeamsAlreadyBuilt, HttpStatusCode.BadRequest);
            }

            if (settings.IsVotingLockedFor(matchDay.MatchDayDate, DateTime.Now))
            {
                throw new MatchDayServiceException(RestErrorMessageDetail.VotingLocked, HttpStatusCode.BadRequest);
            }
        }

        MatchDayParticipant? participant = null;
        if (request.MatchDayParticipantId != null)
        {
            participant = await db.MatchDayParticipants.FirstOrDefaultAsync(p => p.Id == request.MatchDayParticipantId)
                ?? throw new MatchDayServiceException(RestErrorMessageDetail.ParticipantNotFound, HttpStatusCode.NotFound);

            // Fetching purely by Id let any caller who passed the self-check above (their own
            // PlayerId) repurpose a DIFFERENT player's participant row by supplying its Id -
            // verify the row actually belongs to this player and this MatchDay before touching it.
            if (participant.PlayerId != playerId || participant.MatchDayId != matchDay.Id)
            {
                throw new BofcSecurityException(RestErrorMessageDetail.NotAuthorizedForAction, HttpStatusCode.Forbidden);
            }
        }

        // No id supplied (or none known to the caller): find this player's own row for this
        // MatchDay and update it, rather than refusing the change.
        //
        // (MatchDayId, PlayerId) is already unique - see MatchDayParticipantConfiguration - so the
        // row id the client sends is redundant: the server can always identify the row itself.
        // Requiring it meant a player whose client did not happen to know the id could not change
        // their answer at all, and that is not a rare corner. A player who votes from the reminder
        // email, from a second device, or from a tab opened before they first voted has a client
        // holding no id, and every attempt to switch their answer came back 409 Conflict. Roughly
        // four in ten of all RSVP submissions in the production logs failed this way, including
        // one player who tried three times in forty seconds and was refused each time.
        //
        // Looking the row up by (MatchDay, player) is also strictly safer than trusting a
        // client-supplied row id: playerId is already authorised above, so this can only ever
        // reach the caller's own row, which is exactly what the ownership check above has to
        // police manually on the other branch.
        participant ??= await db.MatchDayParticipants
            .FirstOrDefaultAsync(p => p.MatchDayId == matchDay.Id && p.PlayerId == playerId);

        if (participant is null)
        {
            participant = new MatchDayParticipant();
            db.MatchDayParticipants.Add(participant);
        }

        participant.MatchDayId = matchDay.Id;
        participant.PlayerId = player.Id;
        participant.ParticipationStatus = request.ParticipationStatus;
        participant.Comments = StringUtils.NormalizeString(request.Comments);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) when (request.MatchDayParticipantId == null)
        {
            // Two concurrent first-time RSVPs from the same player can both find no existing row
            // above and both insert - the unique index on (MatchDayId, PlayerId) is the real
            // guard; map its violation to a friendly 409 instead of a masked 500. Now that the
            // lookup above upserts, this is a genuine race rather than the everyday "your client
            // did not know the row id" case, and retrying will succeed.
            throw new MatchDayServiceException(RestErrorMessageDetail.AlreadyParticipant, HttpStatusCode.Conflict);
        }
    }

    public async Task<List<PlayerParticipationResponse>> PlayersToBeSelectedForTeamAsync(long matchDayId)
    {
        var participants = await db.MatchDayParticipants.Include(p => p.Player)
            .Where(p => p.MatchDayId == matchDayId && p.ParticipationStatus)
            .ToListAsync();

        var teamIds = await db.Teams.Where(t => t.MatchDayId == matchDayId).Select(t => t.Id).ToListAsync();
        var assignedPlayerIds = (await db.TeamPlayers.Where(tp => teamIds.Contains(tp.TeamId)).Select(tp => tp.PlayerId).ToListAsync())
            .ToHashSet();

        return participants
            .Where(participant => !assignedPlayerIds.Contains(participant.PlayerId))
            .Select(participant => new PlayerParticipationResponse
            {
                PlayerId = participant.Player.Id,
                PlayerName = participant.Player.Name,
                EmployeeId = participant.Player.EmployeeId,
                ParticipationStatus = participant.ParticipationStatus,
                Comments = participant.Comments,
            })
            .ToList();
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
        // NOT in the excluded list (i.e. teams already formed for this MatchDay) - fewer =
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

        var settings = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        var teamsBuilt = await db.Teams.AnyAsync(t => t.MatchDayId == latestMatchDay.Id);
        var votingLocked = settings?.IsVotingLockedFor(latestMatchDay.MatchDayDate, DateTime.Now, teamsBuilt) ?? false;

        return new LatestMatchDayWithUserParticipantsResponse
        {
            MatchDay = latestMatchDay,
            TotalParticipant = totalParticipants,
            TotalPlayer = totalPlayers,
            RemainParticipant = totalPlayers - totalParticipants,
            IsUserParticipated = isUserParticipated,
            MatchDayParticipantId = matchDayParticipantId,
            VotingLocked = votingLocked,
        };
    }
}
