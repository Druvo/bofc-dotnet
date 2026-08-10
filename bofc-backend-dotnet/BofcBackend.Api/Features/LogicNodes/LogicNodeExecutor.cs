using System.Net;
using System.Text.Json;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Rounds.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.LogicNodes;

/// <summary>Port of service/LogicNodeExecutor.java - the rule-driven team-advancement engine.</summary>
public class LogicNodeExecutor(BofcDbContext db, ILogger<LogicNodeExecutor> logger)
{
    public async Task<AdvancedTeamsResponse?> ExecuteLogicNodeAsync(LogicNode logicNode)
    {
        logger.LogInformation("Executing logic node ID: {Id} - {Name}", logicNode.Id, logicNode.NodeName);

        try
        {
            using var ruleConfig = JsonDocument.Parse(logicNode.RuleConfig ?? "{}");
            var root = ruleConfig.RootElement;
            var ruleType = root.TryGetProperty("type", out var typeProp) ? typeProp.GetString() ?? "TOP_N_FROM_EACH" : "TOP_N_FROM_EACH";
            var topN = root.TryGetProperty("topN", out var topNProp) ? topNProp.GetInt32() : 2;

            List<Team> teamsToAdvance;
            long? sourceRoundId = null;
            string? sourceRoundName = null;

            if (logicNode.SourceRoundId != null)
            {
                var sourceRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == logicNode.SourceRoundId)
                    ?? throw new RoundServiceException("Round is not found", HttpStatusCode.NotFound);
                sourceRoundId = sourceRound.Id;
                sourceRoundName = sourceRound.RoundName;
                teamsToAdvance = await GetTeamsFromRoundAsync(sourceRound, ruleType, topN, root);
            }
            else if (logicNode.SourceGroupId != null)
            {
                var sourceGroup = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == logicNode.SourceGroupId)
                    ?? throw new RoundServiceException("Group is not found", HttpStatusCode.NotFound);
                teamsToAdvance = await GetTeamsFromGroupAsync(sourceGroup, ruleType, topN, root);
            }
            else
            {
                throw new RoundServiceException(
                    "Logic node must have either sourceRound or sourceGroup",
                    HttpStatusCode.BadRequest);
            }

            if (teamsToAdvance.Count == 0)
            {
                logger.LogWarning("No teams found to advance for logic node ID: {Id}", logicNode.Id);
                return null;
            }

            var targetRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == logicNode.TargetRoundId)
                ?? throw new RoundServiceException("Round is not found", HttpStatusCode.NotFound);

            var advancedTeams = await AssignTeamsToTargetRoundAsync(teamsToAdvance, targetRound, logicNode);

            logger.LogInformation("Logic node executed: {Count} teams advanced to round {RoundName}",
                advancedTeams.Count, targetRound.RoundName);

            return new AdvancedTeamsResponse
            {
                SourceRoundId = sourceRoundId ?? 0,
                SourceRoundName = sourceRoundName,
                TargetRoundId = targetRound.Id,
                TargetRoundName = targetRound.RoundName,
                TeamsAdvanced = advancedTeams.Count,
                Teams = advancedTeams,
            };
        }
        catch (Exception e) when (e is not AppException)
        {
            logger.LogError(e, "Failed to execute logic node ID: {Id}", logicNode.Id);
            throw new RoundServiceException(
                $"Failed to execute logic node: {e.Message}",
                HttpStatusCode.InternalServerError);
        }
    }

    private async Task<List<Team>> GetTeamsFromRoundAsync(MatchDayRound sourceRound, string ruleType, int topN, JsonElement ruleConfig)
    {
        var teams = new List<Team>();

        if (ruleType == "TOP_N_FROM_EACH")
        {
            var groups = await db.RoundGroups.Where(g => g.RoundId == sourceRound.Id).ToListAsync();
            foreach (var group in groups)
            {
                teams.AddRange(await GetTopNTeamsFromGroupAsync(group, topN, ruleConfig));
            }
        }
        else if (ruleType == "TOP_N_OVERALL")
        {
            var groups = await db.RoundGroups.Where(g => g.RoundId == sourceRound.Id).ToListAsync();
            var groupIds = groups.Select(g => g.Id).ToList();
            var allStandings = await db.GroupStandings.Include(s => s.Team)
                .Where(s => groupIds.Contains(s.GroupId)).ToListAsync();

            var sortedStandings = SortStandings(allStandings, ruleConfig);
            teams = sortedStandings.Take(topN).Select(s => s.Team).ToList();
        }
        else if (ruleType == "ALL_TEAMS")
        {
            if (sourceRound.RoundType == RoundType.GROUP_BASED)
            {
                var groups = await db.RoundGroups.Where(g => g.RoundId == sourceRound.Id).ToListAsync();
                var groupIds = groups.Select(g => g.Id).ToList();
                var groupTeams = await db.RoundGroupTeams.Include(t => t.Team)
                    .Where(t => groupIds.Contains(t.GroupId) && !t.IsPlaceholder && t.Team != null).ToListAsync();
                teams.AddRange(groupTeams.Select(t => t.Team!));
            }
            else
            {
                var roundTeams = await db.RoundTeams.Include(t => t.Team)
                    .Where(t => t.RoundId == sourceRound.Id && !t.IsPlaceholder && t.Team != null).ToListAsync();
                teams = roundTeams.Select(t => t.Team!).ToList();
            }
        }

        return teams;
    }

    private async Task<List<Team>> GetTeamsFromGroupAsync(RoundGroup sourceGroup, string ruleType, int topN, JsonElement ruleConfig)
    {
        if (ruleType is "TOP_N_FROM_EACH" or "TOP_N_OVERALL")
        {
            return await GetTopNTeamsFromGroupAsync(sourceGroup, topN, ruleConfig);
        }

        if (ruleType == "ALL_TEAMS")
        {
            var groupTeams = await db.RoundGroupTeams.Include(t => t.Team)
                .Where(t => t.GroupId == sourceGroup.Id && !t.IsPlaceholder && t.Team != null).ToListAsync();
            return groupTeams.Select(t => t.Team!).ToList();
        }

        return [];
    }

    private async Task<List<Team>> GetTopNTeamsFromGroupAsync(RoundGroup group, int topN, JsonElement ruleConfig)
    {
        var standings = await db.GroupStandings.Include(s => s.Team).Where(s => s.GroupId == group.Id).ToListAsync();

        if (standings.Count == 0)
        {
            logger.LogWarning("No standings found for group ID: {Id}", group.Id);
            return [];
        }

        var sortedStandings = SortStandings(standings, ruleConfig);
        return sortedStandings.Take(topN).Select(s => s.Team).ToList();
    }

    /// <summary>
    /// Java's default tertiary rule is "HEAD_TO_HEAD", but the sort only special-cases "GOALS_FOR"
    /// for the tertiary slot - the default HEAD_TO_HEAD tie-break is a no-op in Java, falling through
    /// straight to the Position comparison. Reproduced as-is (not fixed) to match existing behavior.
    /// </summary>
    private static List<GroupStanding> SortStandings(List<GroupStanding> standings, JsonElement ruleConfig)
    {
        string primary = "POINTS", secondary = "GOAL_DIFFERENCE", tertiary = "HEAD_TO_HEAD";
        if (ruleConfig.TryGetProperty("tieBreakerRules", out var tieBreakerRules))
        {
            if (tieBreakerRules.TryGetProperty("primary", out var p)) primary = p.GetString() ?? primary;
            if (tieBreakerRules.TryGetProperty("secondary", out var s)) secondary = s.GetString() ?? secondary;
            if (tieBreakerRules.TryGetProperty("tertiary", out var t)) tertiary = t.GetString() ?? tertiary;
        }

        var sorted = new List<GroupStanding>(standings);
        sorted.Sort((a, b) =>
        {
            if (primary == "POINTS")
            {
                var cmp = b.Points.CompareTo(a.Points);
                if (cmp != 0) return cmp;
            }

            if (secondary == "GOAL_DIFFERENCE")
            {
                var cmp = b.GoalDifference.CompareTo(a.GoalDifference);
                if (cmp != 0) return cmp;
            }

            if (tertiary == "GOALS_FOR")
            {
                var cmp = b.GoalsFor.CompareTo(a.GoalsFor);
                if (cmp != 0) return cmp;
            }

            if (a.Position != null && b.Position != null)
            {
                return a.Position.Value.CompareTo(b.Position.Value);
            }

            return 0;
        });

        return sorted;
    }

    private async Task<List<AdvancedTeamsResponse.TeamAdvancementInfo>> AssignTeamsToTargetRoundAsync(
        List<Team> teams, MatchDayRound targetRound, LogicNode logicNode)
    {
        var advancedTeams = new List<AdvancedTeamsResponse.TeamAdvancementInfo>();

        foreach (var team in teams)
        {
            if (targetRound.RoundType == RoundType.GROUP_BASED)
            {
                var firstGroup = await db.RoundGroups.FirstOrDefaultAsync(g => g.RoundId == targetRound.Id);
                if (firstGroup != null)
                {
                    if (!await db.RoundGroupTeams.AnyAsync(t => t.GroupId == firstGroup.Id && t.TeamId == team.Id))
                    {
                        db.RoundGroupTeams.Add(new RoundGroupTeam
                        {
                            GroupId = firstGroup.Id,
                            TeamId = team.Id,
                            AssignmentType = TeamAssignmentType.MANUAL,
                            IsPlaceholder = false,
                        });
                    }
                }
                else if (!await db.RoundTeams.AnyAsync(t => t.RoundId == targetRound.Id && t.TeamId == team.Id))
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
            else if (!await db.RoundTeams.AnyAsync(t => t.RoundId == targetRound.Id && t.TeamId == team.Id))
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
                AdvancementReason = $"LOGIC_NODE: {logicNode.NodeName}",
            });
        }

        await db.SaveChangesAsync();
        return advancedTeams;
    }
}
