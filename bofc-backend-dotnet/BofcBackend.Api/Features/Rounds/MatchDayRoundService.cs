using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Matches.Models;
using BofcBackend.Api.Features.Rounds.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Rounds;

/// <summary>
/// Port of service/MatchDayRoundServiceImpl.java. Two Java methods are intentionally NOT
/// ported: advanceTeamsToNextRound (automatic rule-based advancement) and its helper
/// determineTeamsToAdvance — the latter is a literal stub in the Java source ("Implementation
/// depends on rule type... For now, returning empty list") and is never actually invoked from
/// completeRound (only the manual-selection path, advanceSelectedTeamsToNextRound, is). Dead
/// code in the source, so nothing is lost by leaving it out here. LogicNodeService is injected
/// in Java but likewise never called from any method in this class.
/// </summary>
public class MatchDayRoundService(BofcDbContext db, IRoundGroupService roundGroupService) : IMatchDayRoundService
{
    public async Task<MatchDayRoundResponse> CreateRoundAsync(MatchDayRoundRequest request)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == request.MatchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        if (await db.MatchDayRounds.AnyAsync(r => r.MatchDayId == request.MatchDayId && r.RoundNumber == request.RoundNumber))
        {
            throw new RoundServiceException(RestErrorMessageDetail.RoundNumberAlreadyExists, HttpStatusCode.Conflict);
        }

        // Auto-calculate sequenceOrder to prevent duplicates/races — ignore whatever the
        // frontend sent for it, same as Java.
        var maxSequenceOrder = await db.MatchDayRounds.Where(r => r.MatchDayId == request.MatchDayId)
            .Select(r => (int?)r.SequenceOrder).MaxAsync() ?? 0;

        var round = new MatchDayRound
        {
            MatchDayId = matchDay.Id,
            RoundNumber = request.RoundNumber!.Value,
            RoundName = request.RoundName,
            RoundType = Enum.Parse<RoundType>(request.RoundType),
            AdvancementRuleText = request.AdvancementRule,
            Status = RoundStatus.NOT_STARTED,
            SequenceOrder = maxSequenceOrder + 1,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
        };

        db.MatchDayRounds.Add(round);
        await db.SaveChangesAsync();
        return await ConvertToRoundResponseAsync(round);
    }

    public async Task<MatchDayRoundResponse> UpdateRoundAsync(long roundId, MatchDayRoundRequest request)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == roundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (round.RoundNumber != request.RoundNumber
            && await db.MatchDayRounds.AnyAsync(r => r.MatchDayId == request.MatchDayId && r.RoundNumber == request.RoundNumber))
        {
            throw new RoundServiceException(RestErrorMessageDetail.RoundNumberAlreadyExists, HttpStatusCode.Conflict);
        }

        if (round.SequenceOrder != request.SequenceOrder
            && await db.MatchDayRounds.AnyAsync(r => r.MatchDayId == request.MatchDayId && r.SequenceOrder == request.SequenceOrder))
        {
            throw new RoundServiceException(RestErrorMessageDetail.InvalidRoundSequence, HttpStatusCode.Conflict);
        }

        round.RoundNumber = request.RoundNumber!.Value;
        round.RoundName = request.RoundName;
        round.RoundType = Enum.Parse<RoundType>(request.RoundType);
        round.AdvancementRuleText = request.AdvancementRule;
        round.SequenceOrder = request.SequenceOrder!.Value;
        round.StartDate = request.StartDate;
        round.EndDate = request.EndDate;

        await db.SaveChangesAsync();
        return await ConvertToRoundResponseAsync(round);
    }

    public async Task DeleteRoundAsync(long roundId)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == roundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (await db.Matches.CountAsync(m => m.RoundId == roundId) > 0)
        {
            throw new RoundServiceException(RestErrorMessageDetail.RoundHasMatches, HttpStatusCode.Conflict);
        }

        // RoundGroups/RoundTeams/AdvancementRules/LogicNodes are all DeleteBehavior.Restrict
        // against MatchDayRound — a round can reach this point with groups or manually-assigned
        // teams but no matches yet (AssignTeamsToRoundAsync allows that), and deleting it would
        // otherwise throw a raw FK-constraint DbUpdateException (masked as a 500).
        var hasDependents = await db.RoundGroups.AnyAsync(g => g.RoundId == roundId)
            || await db.RoundTeams.AnyAsync(rt => rt.RoundId == roundId)
            || await db.AdvancementRules.AnyAsync(a => a.SourceRoundId == roundId || a.TargetRoundId == roundId)
            || await db.LogicNodes.AnyAsync(n => n.SourceRoundId == roundId || n.TargetRoundId == roundId);
        if (hasDependents)
        {
            throw new RoundServiceException(RestErrorMessageDetail.RoundHasDependents, HttpStatusCode.Conflict);
        }

        db.MatchDayRounds.Remove(round);
        await db.SaveChangesAsync();
    }

    public async Task<MatchDayRoundResponse> GetRoundByIdAsync(long roundId)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == roundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);
        return await ConvertToRoundResponseAsync(round);
    }

    public async Task<List<MatchDayRoundResponse>> GetRoundsByMatchDayIdAsync(long matchDayId)
    {
        var rounds = await db.MatchDayRounds.Where(r => r.MatchDayId == matchDayId)
            .OrderBy(r => r.SequenceOrder).ToListAsync();
        var responses = new List<MatchDayRoundResponse>();
        foreach (var round in rounds)
        {
            responses.Add(await ConvertToRoundResponseAsync(round));
        }
        return responses;
    }

    public async Task<MatchDayStructureResponse> GetMatchDayStructureAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        var rounds = await db.MatchDayRounds.Where(r => r.MatchDayId == matchDayId)
            .OrderBy(r => r.SequenceOrder).ToListAsync();

        var roundResponses = new List<MatchDayRoundResponse>();
        foreach (var round in rounds)
        {
            roundResponses.Add(await ConvertToRoundResponseAsync(round));
        }

        var totalMatches = await db.Matches.CountAsync(m => m.MatchDayId == matchDayId);
        var completedMatches = await db.Matches.CountAsync(m => m.MatchDayId == matchDayId && m.MatchStatus == MatchStatus.COMPLETED);

        return new MatchDayStructureResponse
        {
            MatchDayId = matchDay.Id,
            MatchDayName = matchDay.Name,
            SportType = matchDay.SportType.ToString(),
            MatchDayType = matchDay.MatchDayType.ToString(),
            Status = matchDay.MatchDayStatus.ToString(),
            Rounds = roundResponses,
            TotalRounds = rounds.Count,
            TotalMatches = totalMatches,
            CompletedMatches = completedMatches,
        };
    }

    public async Task<AdvancedTeamsResponse?> CompleteRoundAsync(RoundCompletionRequest request)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == request.RoundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (!await AreAllMatchesCompletedInRoundAsync(round.Id, round.RoundType))
        {
            throw new RoundServiceException(RestErrorMessageDetail.RoundNotCompleted, HttpStatusCode.BadRequest);
        }

        if (request.RecalculateStandings is null or true)
        {
            await RecalculateGroupStandingsForRoundAsync(round);
        }

        // Transaction: marking the round COMPLETED and advancing the selected teams must
        // succeed together — if team advancement fails (e.g. a bad team ID), the round must
        // not be left stuck as COMPLETED with nothing actually advanced.
        await using var transaction = await db.Database.BeginTransactionAsync();

        round.Status = RoundStatus.COMPLETED;
        await db.SaveChangesAsync();

        AdvancedTeamsResponse? result = null;
        if (request.SelectedTeamIds is { Count: > 0 })
        {
            result = await AdvanceSelectedTeamsToNextRoundAsync(round, request.SelectedTeamIds);
        }

        await transaction.CommitAsync();

        return result;
    }

    public async Task<MatchDayRoundResponse> StartRoundAsync(long roundId)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == roundId)
            ?? throw new RoundServiceException($"Round with ID {roundId} is not found", HttpStatusCode.NotFound);

        if (round.Status != RoundStatus.NOT_STARTED)
        {
            throw new RoundServiceException(
                $"Round is already {round.Status}. Only NOT_STARTED rounds can be started.", HttpStatusCode.Conflict);
        }

        // Gate on the round's actual feeder rounds (bracket logic-node edges), not the adjacent
        // sequence number — keeps parallel brackets independent (e.g. Plate Final only waits on
        // the Plate Semifinal, never the Cup Final). A round with no feeders is an entry round.
        foreach (var sourceRoundId in await FindSourceRoundIdsAsync(round))
        {
            var sourceRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == sourceRoundId);
            if (sourceRound != null && sourceRound.Status != RoundStatus.COMPLETED)
            {
                throw new RoundServiceException(
                    $"Cannot start round '{round.RoundName}'. Feeder round '{sourceRound.RoundName}' (Sequence {sourceRound.SequenceOrder}) must be completed first.",
                    HttpStatusCode.BadRequest);
            }
        }

        if (round.RoundType == RoundType.DIRECT_KNOCKOUT)
        {
            if (await db.Matches.CountAsync(m => m.RoundId == roundId) == 0)
            {
                throw new RoundServiceException(
                    $"Cannot start round '{round.RoundName}'. You must generate matches for this DIRECT_KNOCKOUT round before starting it. Please use the 'Generate Matches' button to create the fixtures first.",
                    HttpStatusCode.BadRequest);
            }
        }
        else if (round.RoundType == RoundType.GROUP_BASED)
        {
            var groups = await db.RoundGroups.Where(g => g.RoundId == roundId).ToListAsync();
            if (groups.Count == 0)
            {
                throw new RoundServiceException(
                    $"Cannot start round '{round.RoundName}'. You must create groups for this GROUP_BASED round before starting it.",
                    HttpStatusCode.BadRequest);
            }

            var hasMatches = false;
            foreach (var group in groups)
            {
                if (await db.Matches.CountAsync(m => m.GroupId == group.Id) > 0)
                {
                    hasMatches = true;
                    break;
                }
            }

            if (!hasMatches)
            {
                throw new RoundServiceException(
                    $"Cannot start round '{round.RoundName}'. You must generate matches for the groups in this round before starting it. Please use the 'Generate Matches' button on each group to create the fixtures first.",
                    HttpStatusCode.BadRequest);
            }
        }

        round.Status = RoundStatus.ONGOING;
        await db.SaveChangesAsync();
        return await ConvertToRoundResponseAsync(round);
    }

    public async Task<MatchDayRoundResponse?> GetNextRoundAsync(long matchDayId, int currentSequenceOrder)
    {
        var round = await FindNextRoundBySequenceAsync(matchDayId, currentSequenceOrder);
        return round == null ? null : await ConvertToRoundResponseAsync(round);
    }

    public async Task<MatchDayRoundResponse?> GetPreviousRoundAsync(long matchDayId, int currentSequenceOrder)
    {
        var maxPreviousSequence = await db.MatchDayRounds
            .Where(r => r.MatchDayId == matchDayId && r.SequenceOrder < currentSequenceOrder)
            .Select(r => (int?)r.SequenceOrder).MaxAsync();

        if (maxPreviousSequence == null)
        {
            return null;
        }

        // Multiple rounds could in theory share a sequenceOrder (duplicates should be prevented
        // by CreateRoundAsync's auto-calculation, but this ties on id ASC same as Java, just in case).
        var round = await db.MatchDayRounds
            .Where(r => r.MatchDayId == matchDayId && r.SequenceOrder == maxPreviousSequence)
            .OrderBy(r => r.Id).FirstOrDefaultAsync();

        return round == null ? null : await ConvertToRoundResponseAsync(round);
    }

    public async Task AssignTeamsToRoundAsync(long roundId, TeamAssignmentRequest request)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == roundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (round.RoundType != RoundType.DIRECT_KNOCKOUT)
        {
            throw new RoundServiceException(
                "Teams can only be assigned directly to DIRECT_KNOCKOUT rounds. Use group assignment for GROUP_BASED rounds.",
                HttpStatusCode.BadRequest);
        }
        if (round.Status != RoundStatus.NOT_STARTED)
        {
            throw new RoundServiceException("Cannot assign teams to a round that has already started", HttpStatusCode.BadRequest);
        }

        var teamAssignments = new List<RoundTeam>();
        foreach (var teamId in request.TeamIds)
        {
            if (await db.RoundTeams.AnyAsync(rt => rt.RoundId == roundId && rt.TeamId == teamId))
            {
                continue; // Skip already-assigned teams.
            }
            if (!await db.Teams.AnyAsync(t => t.Id == teamId))
            {
                throw new RoundServiceException($"Team with ID {teamId} not found", HttpStatusCode.NotFound);
            }
            teamAssignments.Add(new RoundTeam
            {
                RoundId = roundId,
                TeamId = teamId,
                AssignmentType = TeamAssignmentType.MANUAL,
                IsPlaceholder = false,
            });
        }

        if (teamAssignments.Count > 0)
        {
            db.RoundTeams.AddRange(teamAssignments);
            await db.SaveChangesAsync();
        }
    }

    public async Task RemoveTeamFromRoundAsync(long roundId, long teamId)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == roundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (round.RoundType != RoundType.DIRECT_KNOCKOUT)
        {
            throw new RoundServiceException(
                "Teams can only be removed from DIRECT_KNOCKOUT rounds. Use group team removal for GROUP_BASED rounds.",
                HttpStatusCode.BadRequest);
        }
        if (round.Status != RoundStatus.NOT_STARTED)
        {
            throw new RoundServiceException("Cannot remove teams from a round that has already started", HttpStatusCode.BadRequest);
        }

        var roundTeam = await db.RoundTeams.FirstOrDefaultAsync(rt => rt.RoundId == roundId && rt.TeamId == teamId)
            ?? throw new RoundServiceException("Team is not in this round", HttpStatusCode.NotFound);

        if (await db.Matches.CountAsync(m => m.RoundId == roundId && (m.HomeTeamId == teamId || m.AwayTeamId == teamId)) > 0)
        {
            throw new RoundServiceException("Cannot remove team with existing matches", HttpStatusCode.Conflict);
        }

        db.RoundTeams.Remove(roundTeam);
        await db.SaveChangesAsync();
    }

    public async Task<List<MatchResponse>> GenerateRoundMatchesAsync(long roundId, RoundMatchGenerationRequest request)
    {
        var round = await db.MatchDayRounds.Include(r => r.MatchDay).FirstOrDefaultAsync(r => r.Id == roundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (round.RoundType != RoundType.DIRECT_KNOCKOUT)
        {
            throw new RoundServiceException(
                "Match generation is only available for DIRECT_KNOCKOUT rounds. Use group match generation for GROUP_BASED rounds.",
                HttpStatusCode.BadRequest);
        }

        var roundTeams = await db.RoundTeams.Include(rt => rt.Team).Where(rt => rt.RoundId == roundId).ToListAsync();
        var teams = roundTeams.Where(rt => !rt.IsPlaceholder && rt.Team != null).Select(rt => rt.Team!).ToList();

        if (teams.Count < 2)
        {
            throw new RoundServiceException("At least 2 teams required to generate matches", HttpStatusCode.BadRequest);
        }

        if (await db.Matches.CountAsync(m => m.RoundId == roundId) > 0)
        {
            throw new RoundServiceException("Matches already exist for this round. Clear them first.", HttpStatusCode.Conflict);
        }

        var matchTimeGap = request.MatchTimeGapMinutes ?? 180;
        var matchDuration = request.MatchDurationMinutes ?? 90;

        Venue? venue = null;
        if (request.VenueId != null)
        {
            venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId);
        }

        List<Match> matches;
        var format = request.FixtureFormat!.Value;
        if (format == FixtureFormat.SINGLE_ELIMINATION)
        {
            // GenerateSingleEliminationMatchesAsync pairs teams two at a time — an odd team count
            // previously left the last (lowest-seeded) team silently unpaired and un-advanced,
            // vanishing from the bracket with no match, no bye, and no error. This engine has no
            // bye-advancement mechanism (a bye has no match to attach a winner-advances rule to),
            // so surface it as a clear validation error instead of silently dropping a team.
            if (teams.Count % 2 != 0)
            {
                throw new RoundServiceException(
                    $"Single-elimination requires an even number of teams (got {teams.Count}) — add or remove a team first.",
                    HttpStatusCode.BadRequest);
            }
            matches = await GenerateSingleEliminationMatchesAsync(round, teams, request.StartDate!.Value, matchTimeGap, matchDuration, venue);
        }
        else if (format == FixtureFormat.ROUND_ROBIN)
        {
            matches = GenerateRoundRobinMatches(round, teams, request.StartDate!.Value, matchTimeGap, matchDuration, venue, request.DoubleRoundRobin == true);
        }
        else if (format == FixtureFormat.DOUBLE_ROUND_ROBIN)
        {
            matches = GenerateRoundRobinMatches(round, teams, request.StartDate!.Value, matchTimeGap, matchDuration, venue, true);
        }
        else
        {
            throw new RoundServiceException($"Unsupported fixture format: {format}", HttpStatusCode.BadRequest);
        }

        db.Matches.AddRange(matches);
        await db.SaveChangesAsync();

        return matches.Select(m => ConvertToMatchResponse(m, round.MatchDay)).ToList();
    }

    public async Task CheckAndAutoCompleteRoundAsync(long roundId)
    {
        var round = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == roundId);
        if (round is null || round.Status != RoundStatus.ONGOING)
        {
            return;
        }

        if (!await AreAllMatchesCompletedInRoundAsync(round.Id, round.RoundType))
        {
            return;
        }

        if (round.RoundType == RoundType.GROUP_BASED)
        {
            await RecalculateGroupStandingsForRoundAsync(round);
        }

        round.Status = RoundStatus.COMPLETED;
        await db.SaveChangesAsync();
    }

    // === Private helpers ===

    /// <summary>
    /// GROUP_BASED: all matches in every leaf group (groups without child groups — parent
    /// groups are containers with no matches of their own) must be completed.
    /// DIRECT_KNOCKOUT: all matches directly in the round must be completed. A round/group with
    /// zero matches is never considered complete.
    /// </summary>
    private async Task<bool> AreAllMatchesCompletedInRoundAsync(long roundId, RoundType roundType)
    {
        if (roundType == RoundType.GROUP_BASED)
        {
            var groups = await db.RoundGroups.Include(g => g.ChildGroups).Where(g => g.RoundId == roundId).ToListAsync();
            if (groups.Count == 0)
            {
                return false;
            }

            var leafGroups = groups.Where(g => g.ChildGroups.Count == 0).ToList();
            if (leafGroups.Count == 0)
            {
                return false;
            }

            foreach (var group in leafGroups)
            {
                var total = await db.Matches.CountAsync(m => m.GroupId == group.Id);
                if (total == 0)
                {
                    return false;
                }
                var completed = await db.Matches.CountAsync(m => m.GroupId == group.Id && m.MatchStatus == MatchStatus.COMPLETED);
                if (completed != total)
                {
                    return false;
                }
            }
            return true;
        }

        var totalInRound = await db.Matches.CountAsync(m => m.RoundId == roundId);
        if (totalInRound == 0)
        {
            return false;
        }
        var completedInRound = await db.Matches.CountAsync(m => m.RoundId == roundId && m.MatchStatus == MatchStatus.COMPLETED);
        return completedInRound == totalInRound;
    }

    private async Task RecalculateGroupStandingsForRoundAsync(MatchDayRound round)
    {
        if (round.RoundType != RoundType.GROUP_BASED)
        {
            return;
        }

        var groupIds = await db.RoundGroups.Where(g => g.RoundId == round.Id).Select(g => g.Id).ToListAsync();
        foreach (var groupId in groupIds)
        {
            // Delegates to RoundGroupService so the full ranking sequence and card
            // aggregation are applied from a single source of truth.
            await roundGroupService.RecalculateGroupStandingsAsync(groupId);
        }
    }

    private async Task<AdvancedTeamsResponse?> AdvanceSelectedTeamsToNextRoundAsync(MatchDayRound sourceRound, List<long> selectedTeamIds)
    {
        var targetRound = await FindNextRoundBySequenceAsync(sourceRound.MatchDayId, sourceRound.SequenceOrder);
        if (targetRound == null)
        {
            return null;
        }

        var teamsToAdvance = await db.Teams.Where(t => selectedTeamIds.Contains(t.Id)).ToListAsync();
        if (teamsToAdvance.Count != selectedTeamIds.Count)
        {
            throw new RoundServiceException("Some selected teams were not found", HttpStatusCode.BadRequest);
        }

        var advancedTeams = new List<AdvancedTeamsResponse.TeamAdvancementInfo>();
        foreach (var team in teamsToAdvance)
        {
            if (targetRound.RoundType == RoundType.GROUP_BASED)
            {
                var groups = await db.RoundGroups.Where(g => g.RoundId == targetRound.Id).ToListAsync();
                if (groups.Count > 0)
                {
                    db.RoundGroupTeams.Add(new RoundGroupTeam
                    {
                        GroupId = groups[0].Id,
                        TeamId = team.Id,
                        AssignmentType = TeamAssignmentType.MANUAL,
                        IsPlaceholder = false,
                    });
                }
                else
                {
                    db.RoundTeams.Add(new RoundTeam
                    {
                        RoundId = targetRound.Id,
                        TeamId = team.Id,
                        AssignmentType = TeamAssignmentType.MANUAL,
                        IsPlaceholder = false,
                    });
                }
            }
            else
            {
                db.RoundTeams.Add(new RoundTeam
                {
                    RoundId = targetRound.Id,
                    TeamId = team.Id,
                    AssignmentType = TeamAssignmentType.MANUAL,
                    IsPlaceholder = false,
                });
            }

            advancedTeams.Add(new AdvancedTeamsResponse.TeamAdvancementInfo
            {
                TeamId = team.Id,
                TeamName = team.TeamName,
                AdvancementReason = "MANUAL_SELECTION",
            });
        }

        await db.SaveChangesAsync();

        return new AdvancedTeamsResponse
        {
            SourceRoundId = sourceRound.Id,
            SourceRoundName = sourceRound.RoundName,
            TargetRoundId = targetRound.Id,
            TargetRoundName = targetRound.RoundName,
            TeamsAdvanced = advancedTeams.Count,
            Teams = advancedTeams,
        };
    }

    private async Task<MatchDayRound?> FindNextRoundBySequenceAsync(long matchDayId, int sequenceOrder) =>
        await db.MatchDayRounds.Where(r => r.MatchDayId == matchDayId && r.SequenceOrder > sequenceOrder)
            .OrderBy(r => r.SequenceOrder).FirstOrDefaultAsync();

    /// <summary>
    /// Resolves the rounds that feed into the given round using the bracket's logic-node
    /// edges. A feeder is the source round of any logic node whose target is this round; when a
    /// node's source is a group, the group's round is used. Self-references are excluded.
    /// Returns empty for an entry round (no incoming edges).
    /// </summary>
    private async Task<List<long>> FindSourceRoundIdsAsync(MatchDayRound round)
    {
        var nodes = await db.LogicNodes.Include(n => n.SourceGroup)
            .Where(n => n.TargetRoundId == round.Id).ToListAsync();

        var ids = new List<long>();
        foreach (var node in nodes)
        {
            var sourceId = node.SourceRoundId ?? node.SourceGroup?.RoundId;
            if (sourceId != null && sourceId != round.Id && !ids.Contains(sourceId.Value))
            {
                ids.Add(sourceId.Value);
            }
        }
        return ids;
    }

    private async Task<MatchDayRoundResponse> ConvertToRoundResponseAsync(MatchDayRound round)
    {
        var topLevelGroups = await db.RoundGroups.Where(g => g.RoundId == round.Id && g.ParentGroupId == null)
            .OrderBy(g => g.GroupName).ToListAsync();
        var groupResponses = new List<RoundGroupResponse>();
        foreach (var group in topLevelGroups)
        {
            groupResponses.Add(await ConvertToGroupResponseAsync(group));
        }

        var roundTeams = await db.RoundTeams.Include(rt => rt.Team).Where(rt => rt.RoundId == round.Id).ToListAsync();
        var teamResponses = roundTeams.Select(ConvertToTeamSimpleResponse).ToList();

        int totalMatches;
        int completedMatches;
        if (round.RoundType == RoundType.GROUP_BASED)
        {
            var allGroupIds = await db.RoundGroups.Where(g => g.RoundId == round.Id).Select(g => g.Id).ToListAsync();
            totalMatches = await db.Matches.CountAsync(m => m.GroupId != null && allGroupIds.Contains(m.GroupId.Value));
            completedMatches = await db.Matches.CountAsync(m =>
                m.GroupId != null && allGroupIds.Contains(m.GroupId.Value) && m.MatchStatus == MatchStatus.COMPLETED);
        }
        else
        {
            totalMatches = await db.Matches.CountAsync(m => m.RoundId == round.Id);
            completedMatches = await db.Matches.CountAsync(m => m.RoundId == round.Id && m.MatchStatus == MatchStatus.COMPLETED);
        }

        return new MatchDayRoundResponse
        {
            Id = round.Id,
            MatchDayId = round.MatchDayId,
            RoundNumber = round.RoundNumber,
            RoundName = round.RoundName,
            RoundType = round.RoundType.ToString(),
            AdvancementRule = round.AdvancementRuleText,
            Status = round.Status.ToString(),
            SequenceOrder = round.SequenceOrder,
            StartDate = round.StartDate,
            EndDate = round.EndDate,
            Groups = groupResponses.Count == 0 ? null : groupResponses,
            Teams = teamResponses.Count == 0 ? null : teamResponses,
            TotalMatches = totalMatches,
            CompletedMatches = completedMatches,
            SourceRoundIds = await FindSourceRoundIdsAsync(round),
        };
    }

    private async Task<RoundGroupResponse> ConvertToGroupResponseAsync(RoundGroup group)
    {
        var teams = await db.RoundGroupTeams.Include(t => t.Team).Where(t => t.GroupId == group.Id).ToListAsync();
        var standings = await db.GroupStandings.Include(s => s.Team).Where(s => s.GroupId == group.Id)
            .OrderBy(s => s.Position).ToListAsync();
        var totalMatches = await db.Matches.CountAsync(m => m.GroupId == group.Id);
        var completedMatches = await db.Matches.CountAsync(m => m.GroupId == group.Id && m.MatchStatus == MatchStatus.COMPLETED);
        var childGroups = await db.RoundGroups.Where(g => g.ParentGroupId == group.Id).ToListAsync();

        var childResponses = new List<RoundGroupResponse>();
        foreach (var child in childGroups)
        {
            childResponses.Add(await ConvertToGroupResponseAsync(child));
        }

        return new RoundGroupResponse
        {
            Id = group.Id,
            RoundId = group.RoundId,
            ParentGroupId = group.ParentGroupId,
            GroupName = group.GroupName,
            GroupFormat = group.GroupFormat?.ToString(),
            AdvancementRule = group.AdvancementRuleText,
            MaxTeams = group.MaxTeams,
            Status = group.Status.ToString(),
            Teams = teams.Select(ConvertToTeamSimpleResponse).ToList(),
            Standings = standings.Count == 0 ? null : standings.Select(ConvertToStandingResponse).ToList(),
            ChildGroups = childResponses.Count == 0 ? null : childResponses,
            TotalMatches = totalMatches,
            CompletedMatches = completedMatches,
        };
    }

    private static TeamSimpleResponse ConvertToTeamSimpleResponse(RoundGroupTeam roundGroupTeam) => new()
    {
        Id = roundGroupTeam.Team?.Id,
        TeamName = roundGroupTeam.Team?.TeamName,
        IsPlaceholder = roundGroupTeam.IsPlaceholder,
        PlaceholderName = roundGroupTeam.PlaceholderName,
        AssignmentType = roundGroupTeam.AssignmentType.ToString(),
    };

    private static TeamSimpleResponse ConvertToTeamSimpleResponse(RoundTeam roundTeam) => new()
    {
        Id = roundTeam.Team?.Id,
        TeamName = roundTeam.Team?.TeamName,
        IsPlaceholder = roundTeam.IsPlaceholder,
        PlaceholderName = roundTeam.PlaceholderName,
        SeedPosition = roundTeam.SeedPosition,
        AssignmentType = roundTeam.AssignmentType.ToString(),
    };

    private static GroupStandingResponse ConvertToStandingResponse(GroupStanding standing) => new()
    {
        Id = standing.Id,
        GroupId = standing.GroupId,
        TeamId = standing.TeamId,
        TeamName = standing.Team.TeamName,
        MatchesPlayed = standing.MatchesPlayed,
        Wins = standing.Wins,
        Draws = standing.Draws,
        Losses = standing.Losses,
        GoalsFor = standing.GoalsFor,
        GoalsAgainst = standing.GoalsAgainst,
        GoalDifference = standing.GoalDifference,
        Points = standing.Points,
        YellowCards = standing.YellowCards,
        RedCards = standing.RedCards,
        FairPlayPoints = standing.FairPlayPoints,
        TiebreakRank = standing.TiebreakRank,
        Position = standing.Position,
        IsAdvanced = standing.IsAdvanced,
    };

    /// <summary>Generates ONLY the first round of a single-elimination bracket (e.g. 4 teams -&gt; 2 semifinal
    /// matches). Later rounds must be generated separately once winners are known.</summary>
    private async Task<List<Match>> GenerateSingleEliminationMatchesAsync(
        MatchDayRound round, List<Team> teams, DateTime startDate, int matchTimeGap, int matchDuration, Venue? venue)
    {
        var roundTeams = await db.RoundTeams.Where(rt => rt.RoundId == round.Id).ToListAsync();
        var sortedTeams = new List<Team>(teams);
        sortedTeams.Sort((t1, t2) =>
        {
            var seed1 = roundTeams.FirstOrDefault(rt => rt.TeamId == t1.Id)?.SeedPosition;
            var seed2 = roundTeams.FirstOrDefault(rt => rt.TeamId == t2.Id)?.SeedPosition;
            if (seed1 == null && seed2 == null) return 0;
            if (seed1 == null) return 1;
            if (seed2 == null) return -1;
            return seed1.Value.CompareTo(seed2.Value);
        });

        var matches = new List<Match>();
        var currentDate = startDate;
        var matchOrder = 1;
        var matchesInRound = sortedTeams.Count / 2;
        var roundName = GetRoundNameForBracket(sortedTeams.Count);

        for (var i = 0; i < matchesInRound; i++)
        {
            var team1Index = i * 2;
            var team2Index = team1Index + 1;
            if (team2Index < sortedTeams.Count)
            {
                matches.Add(CreateRoundMatch(round, sortedTeams[team1Index], sortedTeams[team2Index],
                    currentDate, matchDuration, venue, matchOrder++, roundName, 1));
                currentDate = currentDate.AddMinutes(matchDuration).AddMinutes(matchTimeGap);
            }
        }
        return matches;
    }

    private static List<Match> GenerateRoundRobinMatches(
        MatchDayRound round, List<Team> teams, DateTime startDate, int matchTimeGap, int matchDuration,
        Venue? venue, bool doubleRoundRobin)
    {
        var matches = new List<Match>();
        var currentDate = startDate;
        var matchOrder = 1;

        for (var i = 0; i < teams.Count; i++)
        {
            for (var j = i + 1; j < teams.Count; j++)
            {
                matches.Add(CreateRoundMatch(round, teams[i], teams[j], currentDate, matchDuration, venue, matchOrder++, "Round Robin", 1));
                currentDate = currentDate.AddMinutes(matchDuration).AddMinutes(matchTimeGap);

                if (doubleRoundRobin)
                {
                    matches.Add(CreateRoundMatch(round, teams[j], teams[i], currentDate, matchDuration, venue, matchOrder++, "Round Robin", 2));
                    currentDate = currentDate.AddMinutes(matchDuration).AddMinutes(matchTimeGap);
                }
            }
        }
        return matches;
    }

    private static string GetRoundNameForBracket(int teamCount) => teamCount switch
    {
        2 => "Final",
        4 => "Semi-Final",
        8 => "Quarter-Final",
        16 => "Round of 16",
        32 => "Round of 32",
        _ => $"Round {teamCount}",
    };

    private static Match CreateRoundMatch(
        MatchDayRound round, Team homeTeam, Team awayTeam, DateTime matchDate, int durationMinutes,
        Venue? venue, int matchOrder, string bracketPosition, int seriesNumber) => new()
    {
        MatchDayId = round.MatchDayId,
        MatchDay = round.MatchDay,
        RoundId = round.Id,
        Round = round,
        GroupId = null,
        GroupName = null,
        LegacyRound = round.RoundNumber,
        HomeTeamId = homeTeam.Id,
        HomeTeam = homeTeam,
        AwayTeamId = awayTeam.Id,
        AwayTeam = awayTeam,
        MatchDate = matchDate,
        MatchStatus = MatchStatus.SCHEDULED,
        MatchDurationMinutes = durationMinutes,
        VenueId = venue?.Id,
        Venue = venue,
        MatchOrder = matchOrder,
        BracketPosition = bracketPosition,
        SeriesNumber = seriesNumber,
        HomeTeamScore = 0,
        AwayTeamScore = 0,
        ElapsedTimeSeconds = 0,
        IsPlaceholderMatch = false,
    };

    private static MatchResponse ConvertToMatchResponse(Match match, MatchDay matchDay)
    {
        var roundNumber = match.Round?.RoundNumber ?? match.LegacyRound;
        var groupName = match.GroupName ?? match.Group?.GroupName;

        return new MatchResponse
        {
            Id = match.Id,
            MatchDayId = matchDay.Id,
            MatchDayName = matchDay.Name,
            HomeTeamId = match.HomeTeamId,
            HomeTeamName = match.HomeTeam!.TeamName,
            AwayTeamId = match.AwayTeamId,
            AwayTeamName = match.AwayTeam!.TeamName,
            VenueId = match.Venue?.Id,
            VenueName = match.Venue?.Name,
            VenueMapLink = match.Venue?.MapLink,
            MatchDate = match.MatchDate,
            MatchStatus = match.MatchStatus.ToString(),
            MatchOrder = match.MatchOrder,
            Round = match.LegacyRound,
            RoundNumber = roundNumber,
            GroupName = groupName,
            HomeTeamScore = match.HomeTeamScore,
            AwayTeamScore = match.AwayTeamScore,
            MatchDurationMinutes = match.MatchDurationMinutes,
            ElapsedTimeSeconds = match.ElapsedTimeSeconds,
            StartedAt = match.StartedAt,
            CompletedAt = match.CompletedAt,
            CreatedDate = match.CreatedDate,
            UpdatedDate = match.UpdatedDate,
        };
    }
}
