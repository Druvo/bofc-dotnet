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

/// <summary>Port of service/RoundGroupServiceImpl.java.</summary>
public class RoundGroupService(BofcDbContext db) : IRoundGroupService
{
    public async Task<RoundGroupResponse> CreateGroupAsync(RoundGroupRequest request)
    {
        var round = await db.TournamentRounds.Include(r => r.Tournament).FirstOrDefaultAsync(r => r.Id == request.RoundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (await db.RoundGroups.AnyAsync(g => g.RoundId == request.RoundId && g.GroupName == request.GroupName))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupNameAlreadyExists, HttpStatusCode.Conflict);
        }

        RoundGroup? parentGroup = null;
        if (request.ParentGroupId != null)
        {
            parentGroup = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == request.ParentGroupId)
                ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
            if (parentGroup.RoundId != request.RoundId)
            {
                throw new RoundServiceException(RestErrorMessageDetail.ParentGroupNotInSameRound, HttpStatusCode.BadRequest);
            }
        }

        var group = new RoundGroup
        {
            RoundId = round.Id,
            ParentGroupId = parentGroup?.Id,
            GroupName = request.GroupName,
            GroupFormat = request.GroupFormat != null ? Enum.Parse<GroupFormat>(request.GroupFormat) : Domain.Enums.GroupFormat.MANUAL,
            AdvancementRuleText = request.AdvancementRule,
            MaxTeams = request.MaxTeams,
            Status = RoundStatus.NOT_STARTED,
        };

        db.RoundGroups.Add(group);
        await db.SaveChangesAsync();
        return await ConvertToGroupResponseAsync(group);
    }

    public async Task<RoundGroupResponse> UpdateGroupAsync(long groupId, RoundGroupRequest request)
    {
        var group = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);

        if (group.GroupName != request.GroupName
            && await db.RoundGroups.AnyAsync(g => g.RoundId == request.RoundId && g.GroupName == request.GroupName))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupNameAlreadyExists, HttpStatusCode.Conflict);
        }

        group.GroupName = request.GroupName!;
        if (request.GroupFormat != null)
        {
            group.GroupFormat = Enum.Parse<GroupFormat>(request.GroupFormat);
        }
        group.AdvancementRuleText = request.AdvancementRule;
        group.MaxTeams = request.MaxTeams;

        await db.SaveChangesAsync();
        return await ConvertToGroupResponseAsync(group);
    }

    public async Task DeleteGroupAsync(long groupId)
    {
        var group = await db.RoundGroups.Include(g => g.ChildGroups).FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);

        if (group.ChildGroups.Count > 0)
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupHasSubGroups, HttpStatusCode.Conflict);
        }

        if (await db.RoundGroupTeams.CountAsync(t => t.GroupId == groupId) > 0)
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupHasTeams, HttpStatusCode.Conflict);
        }

        db.RoundGroups.Remove(group);
        await db.SaveChangesAsync();
    }

    public async Task<RoundGroupResponse> GetGroupByIdAsync(long groupId)
    {
        var group = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        return await ConvertToGroupResponseAsync(group);
    }

    public async Task<List<RoundGroupResponse>> GetGroupsByRoundIdAsync(long roundId)
    {
        var groups = await db.RoundGroups.Where(g => g.RoundId == roundId && g.ParentGroupId == null)
            .OrderBy(g => g.GroupName).ToListAsync();
        var responses = new List<RoundGroupResponse>();
        foreach (var group in groups)
        {
            responses.Add(await ConvertToGroupResponseAsync(group));
        }
        return responses;
    }

    public async Task AssignTeamsToGroupAsync(long groupId, TeamAssignmentRequest request)
    {
        var group = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);

        var currentTeamCount = await db.RoundGroupTeams.CountAsync(t => t.GroupId == groupId);
        if (group.MaxTeams != null && currentTeamCount + request.TeamIds.Count > group.MaxTeams)
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupMaxTeamsReached, HttpStatusCode.BadRequest);
        }

        var teamAssignments = new List<RoundGroupTeam>();
        foreach (var teamId in request.TeamIds)
        {
            if (await db.RoundGroupTeams.AnyAsync(t => t.GroupId == groupId && t.TeamId == teamId))
            {
                throw new RoundServiceException(RestErrorMessageDetail.TeamAlreadyInGroup, HttpStatusCode.Conflict);
            }

            if (!await db.Teams.AnyAsync(t => t.Id == teamId))
            {
                throw new TeamServiceException(RestErrorMessageDetail.TeamIsNotFound, HttpStatusCode.NotFound);
            }

            teamAssignments.Add(new RoundGroupTeam
            {
                GroupId = groupId,
                TeamId = teamId,
                AssignmentType = TeamAssignmentType.MANUAL,
                IsPlaceholder = false,
            });

            if (!await db.GroupStandings.AnyAsync(s => s.GroupId == groupId && s.TeamId == teamId))
            {
                db.GroupStandings.Add(new GroupStanding
                {
                    GroupId = groupId,
                    TeamId = teamId,
                    IsAdvanced = false,
                });
            }
        }

        db.RoundGroupTeams.AddRange(teamAssignments);
        await db.SaveChangesAsync();
    }

    public async Task CreatePlaceholderTeamAsync(PlaceholderTeamRequest request)
    {
        if (request.GroupId != null)
        {
            var group = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == request.GroupId)
                ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);

            db.RoundGroupTeams.Add(new RoundGroupTeam
            {
                GroupId = group.Id,
                TeamId = null,
                AssignmentType = TeamAssignmentType.PLACEHOLDER,
                IsPlaceholder = true,
                PlaceholderName = request.PlaceholderName,
            });
            await db.SaveChangesAsync();
        }
        else if (request.RoundId != null)
        {
            throw new RoundServiceException("Use TeamAssignmentService for direct round placeholders", HttpStatusCode.BadRequest);
        }
        else
        {
            throw new RoundServiceException("Either groupId or roundId must be provided", HttpStatusCode.BadRequest);
        }
    }

    public async Task RemoveTeamFromGroupAsync(long groupId, long teamId)
    {
        if (!await db.RoundGroups.AnyAsync(g => g.Id == groupId))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        }

        var roundGroupTeam = await db.RoundGroupTeams.FirstOrDefaultAsync(t => t.GroupId == groupId && t.TeamId == teamId)
            ?? throw new RoundServiceException("Team is not in this group", HttpStatusCode.NotFound);

        if (await db.Matches.CountAsync(m => m.GroupId == groupId && (m.HomeTeamId == teamId || m.AwayTeamId == teamId)) > 0)
        {
            throw new RoundServiceException("Cannot remove team with existing matches", HttpStatusCode.Conflict);
        }

        db.RoundGroupTeams.Remove(roundGroupTeam);

        var standing = await db.GroupStandings.FirstOrDefaultAsync(s => s.GroupId == groupId && s.TeamId == teamId);
        if (standing != null)
        {
            db.GroupStandings.Remove(standing);
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Recomputes ranking in memory but does NOT persist — matches Java's getGroupStandings,
    /// which is not @Transactional and never calls save/saveAll, so the recomputed positions
    /// are display-only for this response (RecalculateGroupStandingsAsync above is the
    /// persisting equivalent).
    /// </summary>
    public async Task<List<GroupStandingResponse>> GetGroupStandingsAsync(long groupId)
    {
        if (!await db.RoundGroups.AnyAsync(g => g.Id == groupId))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        }

        var standings = await db.GroupStandings.Include(s => s.Team).Where(s => s.GroupId == groupId).ToListAsync();
        var matches = await db.Matches.Where(m => m.GroupId == groupId && m.MatchStatus == MatchStatus.COMPLETED).ToListAsync();
        RankStandings(standings, matches);

        return standings.OrderBy(s => s.Position ?? int.MaxValue).Select(ConvertToStandingResponse).ToList();
    }

    public async Task<List<GroupStandingResponse>> ApplyGroupTiebreakAsync(long groupId, GroupTiebreakRequest request)
    {
        if (!await db.RoundGroups.AnyAsync(g => g.Id == groupId))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        }

        var standings = await db.GroupStandings.Include(s => s.Team).Where(s => s.GroupId == groupId).ToListAsync();
        var standingByTeamId = standings.ToDictionary(s => s.TeamId, s => s);

        for (var i = 0; i < request.OrderedTeamIds.Count; i++)
        {
            var teamId = request.OrderedTeamIds[i];
            if (!standingByTeamId.TryGetValue(teamId, out var standing))
            {
                throw new RoundServiceException($"Team {teamId} is not in this group", HttpStatusCode.BadRequest);
            }
            standing.TiebreakRank = i + 1;
        }

        var matches = await db.Matches.Where(m => m.GroupId == groupId && m.MatchStatus == MatchStatus.COMPLETED).ToListAsync();
        RankStandings(standings, matches);
        await db.SaveChangesAsync();

        return standings.OrderBy(s => s.Position ?? int.MaxValue).Select(ConvertToStandingResponse).ToList();
    }

    public async Task<List<MatchResponse>> GenerateGroupMatchesAsync(long groupId, GroupMatchGenerationRequest request)
    {
        var group = await db.RoundGroups.Include(g => g.Round).ThenInclude(r => r.Tournament)
            .FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);

        var groupTeams = await db.RoundGroupTeams.Include(t => t.Team).Where(t => t.GroupId == groupId).ToListAsync();
        var teams = groupTeams.Where(t => !t.IsPlaceholder && t.Team != null).Select(t => t.Team!).ToList();

        if (teams.Count < 2)
        {
            throw new RoundServiceException("At least 2 teams required to generate matches", HttpStatusCode.BadRequest);
        }

        if (await db.Matches.CountAsync(m => m.GroupId == groupId) > 0)
        {
            throw new RoundServiceException("Matches already exist for this group. Clear them first.", HttpStatusCode.Conflict);
        }

        var matchTimeGap = request.MatchTimeGapMinutes ?? 180;
        var matchDuration = request.MatchDurationMinutes ?? 90;

        Venue? venue = null;
        if (request.VenueId != null)
        {
            venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId);
        }

        // Groups only support round-robin formats (no bracket knockout within a group).
        var format = request.FixtureFormat!.Value;
        if (format != FixtureFormat.ROUND_ROBIN && format != FixtureFormat.DOUBLE_ROUND_ROBIN)
        {
            throw new RoundServiceException(
                "Group match generation only supports ROUND_ROBIN or DOUBLE_ROUND_ROBIN formats", HttpStatusCode.BadRequest);
        }
        var doubleRoundRobin = format == FixtureFormat.DOUBLE_ROUND_ROBIN;

        var matches = new List<Match>();
        var currentMatchDate = request.StartDate!.Value;
        var matchOrder = 1;

        for (var i = 0; i < teams.Count; i++)
        {
            for (var j = i + 1; j < teams.Count; j++)
            {
                matches.Add(CreateGroupMatch(group, teams[i], teams[j], currentMatchDate, matchDuration, venue, matchOrder++));
                currentMatchDate = currentMatchDate.AddMinutes(matchDuration).AddMinutes(matchTimeGap);

                if (doubleRoundRobin)
                {
                    matches.Add(CreateGroupMatch(group, teams[j], teams[i], currentMatchDate, matchDuration, venue, matchOrder++));
                    currentMatchDate = currentMatchDate.AddMinutes(matchDuration).AddMinutes(matchTimeGap);
                }
            }
        }

        db.Matches.AddRange(matches);
        await db.SaveChangesAsync();

        return matches.Select(ConvertToMatchResponse).ToList();
    }

    public async Task<List<MatchResponse>> GetGroupMatchesAsync(long groupId)
    {
        if (!await db.RoundGroups.AnyAsync(g => g.Id == groupId))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        }

        var matches = await db.Matches
            .Include(m => m.Tournament).Include(m => m.HomeTeam).Include(m => m.AwayTeam)
            .Include(m => m.Venue).Include(m => m.Round).Include(m => m.Group)
            .Where(m => m.GroupId == groupId).ToListAsync();

        return matches.Select(ConvertToMatchResponse).ToList();
    }

    public async Task ClearGroupMatchesAsync(long groupId)
    {
        if (!await db.RoundGroups.AnyAsync(g => g.Id == groupId))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        }

        var matches = await db.Matches.Where(m => m.GroupId == groupId).ToListAsync();
        if (matches.Count == 0)
        {
            return;
        }

        db.Matches.RemoveRange(matches);
        await db.SaveChangesAsync();
    }


    // Ordering stages applied in sequence; ties at one stage are broken by the next.
    private const int StagePoints = 0;
    private const int StageGoalDifference = 1;
    private const int StageGoalsFor = 2;
    private const int StageHeadToHead = 3;
    private const int StageFairPlay = 4;
    private const int StageTiebreak = 5;
    private const int StageTeamName = 6;

    public async Task RecalculateGroupStandingsAsync(long groupId)
    {
        if (!await db.RoundGroups.AnyAsync(g => g.Id == groupId))
        {
            throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        }

        var standings = await db.GroupStandings.Include(s => s.Team).Where(s => s.GroupId == groupId).ToListAsync();

        // Reset all standings (TiebreakRank is preserved: it's a manual override).
        foreach (var standing in standings)
        {
            standing.MatchesPlayed = 0;
            standing.Wins = 0;
            standing.Draws = 0;
            standing.Losses = 0;
            standing.GoalsFor = 0;
            standing.GoalsAgainst = 0;
            standing.GoalDifference = 0;
            standing.Points = 0;
            standing.YellowCards = 0;
            standing.RedCards = 0;
            standing.FairPlayPoints = 0;
        }

        var matches = await db.Matches
            .Where(m => m.GroupId == groupId && m.MatchStatus == MatchStatus.COMPLETED)
            .ToListAsync();

        foreach (var match in matches)
        {
            UpdateStandingsForMatch(standings, match);
            await AggregateCardsForMatchAsync(standings, match);
        }

        RankStandings(standings, matches);

        await db.SaveChangesAsync();
    }

    private static void UpdateStandingsForMatch(List<GroupStanding> standings, Match match)
    {
        var home = standings.FirstOrDefault(s => s.TeamId == match.HomeTeamId);
        var away = standings.FirstOrDefault(s => s.TeamId == match.AwayTeamId);
        if (home is null || away is null)
        {
            return;
        }

        home.MatchesPlayed++;
        away.MatchesPlayed++;
        home.GoalsFor += match.HomeTeamScore;
        home.GoalsAgainst += match.AwayTeamScore;
        away.GoalsFor += match.AwayTeamScore;
        away.GoalsAgainst += match.HomeTeamScore;
        home.GoalDifference = home.GoalsFor - home.GoalsAgainst;
        away.GoalDifference = away.GoalsFor - away.GoalsAgainst;

        if (match.HomeTeamScore > match.AwayTeamScore)
        {
            home.Wins++;
            home.Points += 3;
            away.Losses++;
        }
        else if (match.HomeTeamScore < match.AwayTeamScore)
        {
            away.Wins++;
            away.Points += 3;
            home.Losses++;
        }
        else
        {
            home.Draws++;
            home.Points += 1;
            away.Draws++;
            away.Points += 1;
        }
    }

    /// <summary>Aggregates yellow/red cards and UEFA fair-play deductions for one match into the affected team standings.</summary>
    private async Task AggregateCardsForMatchAsync(List<GroupStanding> standings, Match match)
    {
        var events = await db.MatchEvents.Where(e => e.MatchId == match.Id).ToListAsync();
        if (events.Count == 0)
        {
            return;
        }

        // teamId -> (playerId -> [yellowCount, redCount]); null player bucketed under -1.
        var cardsByTeamPlayer = new Dictionary<long, Dictionary<long, int[]>>();
        foreach (var e in events)
        {
            if (e.EventType != MatchEventType.YELLOW_CARD && e.EventType != MatchEventType.RED_CARD)
            {
                continue;
            }
            if (e.TeamId is null)
            {
                continue;
            }
            var teamId = e.TeamId.Value;
            var playerId = e.PlayerId ?? -1L;
            if (!cardsByTeamPlayer.TryGetValue(teamId, out var byPlayer))
            {
                byPlayer = new Dictionary<long, int[]>();
                cardsByTeamPlayer[teamId] = byPlayer;
            }
            if (!byPlayer.TryGetValue(playerId, out var tally))
            {
                tally = new int[2];
                byPlayer[playerId] = tally;
            }
            if (e.EventType == MatchEventType.YELLOW_CARD)
            {
                tally[0]++;
            }
            else
            {
                tally[1]++;
            }
        }

        foreach (var (teamId, playerTallies) in cardsByTeamPlayer)
        {
            var standing = standings.FirstOrDefault(s => s.TeamId == teamId);
            if (standing is null)
            {
                continue;
            }
            int yellow = 0, red = 0, fairPlayDeduction = 0;
            foreach (var tally in playerTallies.Values)
            {
                yellow += tally[0];
                red += tally[1];
                fairPlayDeduction += FairPlayDeduction(tally[0], tally[1]);
            }
            standing.YellowCards += yellow;
            standing.RedCards += red;
            standing.FairPlayPoints += fairPlayDeduction;
        }
    }

    /// <summary>
    /// UEFA fair-play deduction for a single player in a single match (lower total is worse):
    /// single yellow = -1, second yellow (indirect red) = -3, direct red = -4, yellow then direct red = -5.
    /// </summary>
    private static int FairPlayDeduction(int yellowCount, int redCount)
    {
        if (yellowCount >= 2)
        {
            return -3;
        }
        if (yellowCount == 1 && redCount >= 1)
        {
            return -5;
        }
        if (redCount >= 1)
        {
            return -4;
        }
        if (yellowCount == 1)
        {
            return -1;
        }
        return 0;
    }

    /// <summary>
    /// Ranks standings using the full ordering sequence and assigns 1-based positions in place:
    /// Points -> Goal Difference -> Goals For -> Head-to-Head -> Fair Play -> Penalty Shootout
    /// (manual tiebreak) -> Team name.
    /// </summary>
    private static void RankStandings(List<GroupStanding> standings, List<Match> completedMatches)
    {
        var ranked = RankCluster(new List<GroupStanding>(standings), completedMatches, StagePoints);
        for (var i = 0; i < ranked.Count; i++)
        {
            ranked[i].Position = i + 1;
        }
    }

    /// <summary>
    /// Recursively ranks a cluster of teams that are tied up to <paramref name="stage"/>. At each
    /// stage the cluster is sorted, then sub-clusters that remain tied are resolved by the next
    /// stage. Head-to-head is computed relative to the current (tied) cluster only, which keeps
    /// multi-team ties correct.
    /// </summary>
    private static List<GroupStanding> RankCluster(List<GroupStanding> cluster, List<Match> matches, int stage)
    {
        if (cluster.Count <= 1 || stage > StageTeamName)
        {
            return cluster;
        }

        var comparer = ComparerForStage(stage, cluster, matches);
        cluster.Sort(comparer);

        var result = new List<GroupStanding>(cluster.Count);
        var i = 0;
        while (i < cluster.Count)
        {
            var j = i + 1;
            while (j < cluster.Count && comparer.Compare(cluster[i], cluster[j]) == 0)
            {
                j++;
            }
            var tied = cluster.GetRange(i, j - i);
            result.AddRange(tied.Count > 1 ? RankCluster(tied, matches, stage + 1) : tied);
            i = j;
        }
        return result;
    }

    private static IComparer<GroupStanding> ComparerForStage(int stage, List<GroupStanding> cluster, List<Match> matches) =>
        stage switch
        {
            StagePoints => Comparer<GroupStanding>.Create((a, b) => b.Points.CompareTo(a.Points)),
            StageGoalDifference => Comparer<GroupStanding>.Create((a, b) => b.GoalDifference.CompareTo(a.GoalDifference)),
            StageGoalsFor => Comparer<GroupStanding>.Create((a, b) => b.GoalsFor.CompareTo(a.GoalsFor)),
            StageHeadToHead => HeadToHeadComparer(cluster, matches),
            // Higher (closer to 0) fair-play points = fewer cards = ranks higher.
            StageFairPlay => Comparer<GroupStanding>.Create((a, b) => b.FairPlayPoints.CompareTo(a.FairPlayPoints)),
            // Manual penalty-shootout order: lower rank wins, unset (null) sorts last.
            StageTiebreak => Comparer<GroupStanding>.Create((a, b) => CompareNullsLastAscending(a.TiebreakRank, b.TiebreakRank)),
            _ => Comparer<GroupStanding>.Create((a, b) => string.CompareOrdinal(a.Team.TeamName, b.Team.TeamName)),
        };

    /// <summary>
    /// Head-to-head comparator built from a mini-table of only the matches played among the
    /// teams in <paramref name="cluster"/>. Orders by head-to-head points, then goal difference,
    /// then goals for.
    /// </summary>
    private static IComparer<GroupStanding> HeadToHeadComparer(List<GroupStanding> cluster, List<Match> matches)
    {
        var clusterTeamIds = cluster.Select(s => s.TeamId).ToHashSet();

        // teamId -> [points, goalDifference, goalsFor] within the cluster.
        var h2h = clusterTeamIds.ToDictionary(id => id, _ => new int[3]);

        foreach (var match in matches)
        {
            if (!clusterTeamIds.Contains(match.HomeTeamId) || !clusterTeamIds.Contains(match.AwayTeamId))
            {
                continue;
            }
            var home = h2h[match.HomeTeamId];
            var away = h2h[match.AwayTeamId];
            home[2] += match.HomeTeamScore;
            away[2] += match.AwayTeamScore;
            home[1] += match.HomeTeamScore - match.AwayTeamScore;
            away[1] += match.AwayTeamScore - match.HomeTeamScore;
            if (match.HomeTeamScore > match.AwayTeamScore)
            {
                home[0] += 3;
            }
            else if (match.HomeTeamScore < match.AwayTeamScore)
            {
                away[0] += 3;
            }
            else
            {
                home[0] += 1;
                away[0] += 1;
            }
        }

        return Comparer<GroupStanding>.Create((a, b) =>
        {
            var ha = h2h[a.TeamId];
            var hb = h2h[b.TeamId];
            var cmp = hb[0].CompareTo(ha[0]);
            if (cmp != 0)
            {
                return cmp;
            }
            cmp = hb[1].CompareTo(ha[1]);
            return cmp != 0 ? cmp : hb[2].CompareTo(ha[2]);
        });
    }

    private static int CompareNullsLastAscending(int? a, int? b)
    {
        if (a == null && b == null)
        {
            return 0;
        }
        if (a == null)
        {
            return 1;
        }
        if (b == null)
        {
            return -1;
        }
        return a.Value.CompareTo(b.Value);
    }

    private static Match CreateGroupMatch(
        RoundGroup group, Team homeTeam, Team awayTeam, DateTime matchDate, int durationMinutes, Venue? venue, int matchOrder)
    {
        var round = group.Round;
        return new Match
        {
            TournamentId = round.TournamentId,
            Tournament = round.Tournament,
            RoundId = round.Id,
            Round = round,
            GroupId = group.Id,
            Group = group,
            GroupName = group.GroupName,
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
            HomeTeamScore = 0,
            AwayTeamScore = 0,
            ElapsedTimeSeconds = 0,
            IsPlaceholderMatch = false,
        };
    }

    private static MatchResponse ConvertToMatchResponse(Match match)
    {
        var roundNumber = match.Round?.RoundNumber ?? match.LegacyRound;
        var groupName = match.GroupName ?? match.Group?.GroupName;

        return new MatchResponse
        {
            Id = match.Id,
            TournamentId = match.TournamentId,
            TournamentName = match.Tournament?.Name ?? string.Empty,
            HomeTeamId = match.HomeTeamId,
            HomeTeamName = match.HomeTeam?.TeamName ?? string.Empty,
            AwayTeamId = match.AwayTeamId,
            AwayTeamName = match.AwayTeam?.TeamName ?? string.Empty,
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
}
