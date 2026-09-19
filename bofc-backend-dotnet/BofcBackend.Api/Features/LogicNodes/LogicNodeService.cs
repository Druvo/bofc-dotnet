using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.LogicNodes.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.LogicNodes;

/// <summary>Port of service/LogicNodeServiceImpl.java.</summary>
public class LogicNodeService(BofcDbContext db, LogicNodeExecutor logicNodeExecutor, ILogger<LogicNodeService> logger) : ILogicNodeService
{
    public async Task<LogicNodeResponse> CreateLogicNodeAsync(LogicNodeRequest request)
    {
        logger.LogInformation("Creating logic node: {Name} for MatchDay ID: {MatchDayId}", request.NodeName, request.MatchDayId);

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == request.MatchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        if (request.SourceRoundId == null && request.SourceGroupId == null)
        {
            throw new RoundServiceException(
                "Either sourceRoundId or sourceGroupId must be provided",
                HttpStatusCode.BadRequest);
        }

        if (request.SourceRoundId != null && request.SourceGroupId != null)
        {
            throw new RoundServiceException(
                "Cannot specify both sourceRoundId and sourceGroupId",
                HttpStatusCode.BadRequest);
        }

        MatchDayRound? sourceRound = null;
        RoundGroup? sourceGroup = null;
        if (request.SourceRoundId != null)
        {
            sourceRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == request.SourceRoundId)
                ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);
        }
        else
        {
            sourceGroup = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == request.SourceGroupId)
                ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
        }

        var targetRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == request.TargetRoundId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);

        if (!Enum.TryParse<LogicNodeType>(request.NodeType, out var nodeType))
        {
            throw new RoundServiceException($"Invalid node type: {request.NodeType}", HttpStatusCode.BadRequest);
        }

        var logicNode = new LogicNode
        {
            MatchDayId = matchDay.Id,
            NodeName = request.NodeName!,
            NodeType = nodeType,
            SourceRoundId = sourceRound?.Id,
            SourceGroupId = sourceGroup?.Id,
            TargetRoundId = targetRound.Id,
            RuleConfig = request.RuleConfig,
            PriorityOrder = request.PriorityOrder,
            IsActive = request.IsActive ?? true,
            AutoExecute = request.AutoExecute ?? true,
            ExecutionCount = 0,
        };

        db.LogicNodes.Add(logicNode);
        await db.SaveChangesAsync();
        logger.LogInformation("Logic node created successfully with ID: {Id}", logicNode.Id);

        return await ConvertToResponseAsync(logicNode);
    }

    public async Task<LogicNodeResponse> UpdateLogicNodeAsync(long nodeId, LogicNodeRequest request)
    {
        logger.LogInformation("Updating logic node ID: {Id}", nodeId);

        var logicNode = await db.LogicNodes.FirstOrDefaultAsync(n => n.Id == nodeId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.LogicNodeIsNotFound, HttpStatusCode.NotFound);

        if (request.NodeName != null)
        {
            logicNode.NodeName = request.NodeName;
        }

        if (request.NodeType != null)
        {
            if (!Enum.TryParse<LogicNodeType>(request.NodeType, out var nodeType))
            {
                throw new RoundServiceException($"Invalid node type: {request.NodeType}", HttpStatusCode.BadRequest);
            }

            logicNode.NodeType = nodeType;
        }

        if (request.RuleConfig != null)
        {
            logicNode.RuleConfig = request.RuleConfig;
        }

        if (request.PriorityOrder != null)
        {
            logicNode.PriorityOrder = request.PriorityOrder;
        }

        if (request.IsActive != null)
        {
            logicNode.IsActive = request.IsActive.Value;
        }

        if (request.AutoExecute != null)
        {
            logicNode.AutoExecute = request.AutoExecute.Value;
        }

        if (request.SourceRoundId != null)
        {
            var sourceRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == request.SourceRoundId)
                ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);
            logicNode.SourceRoundId = sourceRound.Id;
            logicNode.SourceGroupId = null;
        }
        else if (request.SourceGroupId != null)
        {
            var sourceGroup = await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == request.SourceGroupId)
                ?? throw new RoundServiceException(RestErrorMessageDetail.GroupIsNotFound, HttpStatusCode.NotFound);
            logicNode.SourceGroupId = sourceGroup.Id;
            logicNode.SourceRoundId = null;
        }

        if (request.TargetRoundId != null)
        {
            var targetRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == request.TargetRoundId)
                ?? throw new RoundServiceException(RestErrorMessageDetail.RoundIsNotFound, HttpStatusCode.NotFound);
            logicNode.TargetRoundId = targetRound.Id;
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Logic node updated successfully with ID: {Id}", nodeId);

        return await ConvertToResponseAsync(logicNode);
    }

    public async Task DeleteLogicNodeAsync(long nodeId)
    {
        logger.LogInformation("Deleting logic node ID: {Id}", nodeId);

        var logicNode = await db.LogicNodes.FirstOrDefaultAsync(n => n.Id == nodeId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.LogicNodeIsNotFound, HttpStatusCode.NotFound);

        db.LogicNodes.Remove(logicNode);
        await db.SaveChangesAsync();
        logger.LogInformation("Logic node deleted successfully with ID: {Id}", nodeId);
    }

    public async Task<LogicNodeResponse> GetLogicNodeByIdAsync(long nodeId)
    {
        var logicNode = await db.LogicNodes.FirstOrDefaultAsync(n => n.Id == nodeId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.LogicNodeIsNotFound, HttpStatusCode.NotFound);

        return await ConvertToResponseAsync(logicNode);
    }

    public async Task<List<LogicNodeResponse>> GetLogicNodesByMatchDayAsync(long matchDayId)
    {
        var logicNodes = await db.LogicNodes
            .Where(n => n.MatchDayId == matchDayId)
            .OrderBy(n => n.PriorityOrder == null)
            .ThenBy(n => n.PriorityOrder)
            .ThenBy(n => n.Id)
            .ToListAsync();

        var responses = new List<LogicNodeResponse>();
        foreach (var node in logicNodes)
        {
            responses.Add(await ConvertToResponseAsync(node));
        }

        return responses;
    }

    public async Task<LogicNodeResponse> ExecuteLogicNodeAsync(long nodeId)
    {
        logger.LogInformation("Manually executing logic node ID: {Id}", nodeId);

        var logicNode = await db.LogicNodes.FirstOrDefaultAsync(n => n.Id == nodeId)
            ?? throw new RoundServiceException(RestErrorMessageDetail.LogicNodeIsNotFound, HttpStatusCode.NotFound);

        if (!logicNode.IsActive)
        {
            throw new RoundServiceException("Cannot execute inactive logic node", HttpStatusCode.BadRequest);
        }

        var result = await logicNodeExecutor.ExecuteLogicNodeAsync(logicNode);

        logicNode.ExecutionCount += 1;
        logicNode.LastExecutedAt = ClubTime.Now;
        await db.SaveChangesAsync();

        logger.LogInformation("Logic node executed successfully. Execution count: {Count}. Teams advanced: {Teams}",
            logicNode.ExecutionCount, result?.TeamsAdvanced ?? 0);

        return await ConvertToResponseAsync(logicNode);
    }

    public async Task ExecuteLogicNodesForRoundAsync(long roundId)
    {
        logger.LogInformation("Executing auto-execute logic nodes for round ID: {Id}", roundId);

        var logicNodes = await db.LogicNodes
            .Where(n => n.SourceRoundId == roundId && n.IsActive && n.AutoExecute)
            .OrderBy(n => n.PriorityOrder == null)
            .ThenBy(n => n.PriorityOrder)
            .ToListAsync();

        foreach (var logicNode in logicNodes)
        {
            try
            {
                await ExecuteLogicNodeAsync(logicNode.Id);
                logger.LogInformation("Auto-executed logic node ID: {Id}", logicNode.Id);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Failed to execute logic node ID: {Id}", logicNode.Id);
            }
        }
    }

    public async Task ExecuteLogicNodesForGroupAsync(long groupId)
    {
        logger.LogInformation("Executing auto-execute logic nodes for group ID: {Id}", groupId);

        var logicNodes = await db.LogicNodes
            .Where(n => n.SourceGroupId == groupId && n.IsActive && n.AutoExecute)
            .OrderBy(n => n.PriorityOrder == null)
            .ThenBy(n => n.PriorityOrder)
            .ToListAsync();

        foreach (var logicNode in logicNodes)
        {
            try
            {
                await ExecuteLogicNodeAsync(logicNode.Id);
                logger.LogInformation("Auto-executed logic node ID: {Id}", logicNode.Id);
            }
            catch (Exception e)
            {
                logger.LogError(e, "Failed to execute logic node ID: {Id}", logicNode.Id);
            }
        }
    }

    private async Task<LogicNodeResponse> ConvertToResponseAsync(LogicNode logicNode)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == logicNode.MatchDayId);
        var sourceRound = logicNode.SourceRoundId != null
            ? await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == logicNode.SourceRoundId)
            : null;
        var sourceGroup = logicNode.SourceGroupId != null
            ? await db.RoundGroups.FirstOrDefaultAsync(g => g.Id == logicNode.SourceGroupId)
            : null;
        var targetRound = await db.MatchDayRounds.FirstOrDefaultAsync(r => r.Id == logicNode.TargetRoundId);

        return new LogicNodeResponse
        {
            Id = logicNode.Id,
            MatchDayId = logicNode.MatchDayId,
            MatchDayName = matchDay?.Name,
            NodeName = logicNode.NodeName,
            NodeType = logicNode.NodeType.ToString(),
            SourceRoundId = sourceRound?.Id,
            SourceRoundName = sourceRound?.RoundName,
            SourceGroupId = sourceGroup?.Id,
            SourceGroupName = sourceGroup?.GroupName,
            TargetRoundId = logicNode.TargetRoundId,
            TargetRoundName = targetRound?.RoundName,
            RuleConfig = logicNode.RuleConfig,
            PriorityOrder = logicNode.PriorityOrder,
            IsActive = logicNode.IsActive,
            AutoExecute = logicNode.AutoExecute,
            ExecutionCount = logicNode.ExecutionCount,
            LastExecutedAt = logicNode.LastExecutedAt,
            CreatedDate = logicNode.CreatedDate,
            UpdatedDate = logicNode.UpdatedDate,
        };
    }
}
