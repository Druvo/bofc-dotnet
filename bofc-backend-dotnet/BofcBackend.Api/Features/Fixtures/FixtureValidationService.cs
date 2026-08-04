using System.Net;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Fixtures;

/// <summary>Port of service/validation/FixtureValidationService.java.</summary>
public class FixtureValidationService
{
    public void ValidateTeamsForFixtureGeneration(List<Team>? teams, string type)
    {
        if (teams == null || teams.Count == 0)
        {
            throw new TournamentServiceException("No teams found in tournament", HttpStatusCode.BadRequest);
        }

        if (teams.Count < 2)
        {
            throw new TournamentServiceException("Minimum 2 teams required for fixture generation", HttpStatusCode.BadRequest);
        }

        switch (type.ToUpperInvariant())
        {
            case "KNOCKOUT_SINGLE":
            case "KNOCKOUT_DOUBLE":
                ValidateEliminationFormat(teams.Count);
                break;
            case "GROUP_STAGE_KNOCKOUT":
                ValidateGroupStageFormat(teams.Count);
                break;
            case "ROUND_ROBIN":
                ValidateRoundRobinFormat(teams.Count);
                break;
        }
    }

    private static void ValidateEliminationFormat(int teamCount)
    {
        if (teamCount < 2)
        {
            throw new TournamentServiceException("Elimination tournaments require minimum 2 teams", HttpStatusCode.BadRequest);
        }
    }

    private static void ValidateGroupStageFormat(int teamCount)
    {
        if (teamCount < 4)
        {
            throw new TournamentServiceException("Group stage tournaments require minimum 4 teams", HttpStatusCode.BadRequest);
        }
    }

    private static void ValidateRoundRobinFormat(int teamCount)
    {
        if (teamCount < 2)
        {
            throw new TournamentServiceException("Round-robin tournaments require minimum 2 teams", HttpStatusCode.BadRequest);
        }
    }

    public void ValidateMatchForStateTransition(Match match, MatchStatus targetStatus)
    {
        switch (targetStatus)
        {
            case MatchStatus.ONGOING:
                if (match.MatchStatus != MatchStatus.SCHEDULED)
                {
                    throw new TournamentServiceException("Only scheduled matches can be started", HttpStatusCode.Conflict);
                }
                break;
            case MatchStatus.COMPLETED:
                if (match.MatchStatus != MatchStatus.ONGOING)
                {
                    throw new TournamentServiceException("Only ongoing matches can be completed", HttpStatusCode.Conflict);
                }
                break;
            case MatchStatus.SCHEDULED:
                throw new TournamentServiceException("Cannot transition to scheduled status", HttpStatusCode.BadRequest);
        }
    }

    public void ValidateMatchEventData(long? playerId, long? teamId, long? matchId)
    {
        if (playerId == null || teamId == null || matchId == null)
        {
            throw new TournamentServiceException("Player ID, Team ID, and Match ID are required", HttpStatusCode.BadRequest);
        }
    }
}
