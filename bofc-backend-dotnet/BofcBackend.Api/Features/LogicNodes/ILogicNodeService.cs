using BofcBackend.Api.Features.LogicNodes.Models;

namespace BofcBackend.Api.Features.LogicNodes;

/// <summary>Port of service/LogicNodeService.java.</summary>
public interface ILogicNodeService
{
    Task<LogicNodeResponse> CreateLogicNodeAsync(LogicNodeRequest request);
    Task<LogicNodeResponse> UpdateLogicNodeAsync(long nodeId, LogicNodeRequest request);
    Task DeleteLogicNodeAsync(long nodeId);
    Task<LogicNodeResponse> GetLogicNodeByIdAsync(long nodeId);
    Task<List<LogicNodeResponse>> GetLogicNodesByMatchDayAsync(long matchDayId);
    Task<LogicNodeResponse> ExecuteLogicNodeAsync(long nodeId);
    Task ExecuteLogicNodesForRoundAsync(long roundId);
    Task ExecuteLogicNodesForGroupAsync(long groupId);
}
