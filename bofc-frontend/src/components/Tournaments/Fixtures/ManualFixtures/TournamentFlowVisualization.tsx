import { useCallback, useMemo, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ConnectionMode,
  Panel, 
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, Space,Button, Tooltip, theme } from "antd";
import {
  ExpandOutlined,
  CompressOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import RoundNode from "./Components/RoundNode";
import GroupNode from "./Components/GroupNode";
import TeamNode from "./Components/TeamNode";
import { RoundGroupResponse, TournamentStructureResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";
import { isMatchOngoing } from "../../../../utils/matchTimeUtils";
import { selectLoginInfo } from "../../../../state/slices/loginInfoSlice";
import { hasAnyRole } from "../../../../utils/roleUtils";

const { useToken } = theme;


interface TournamentFlowVisualizationProps {
  tournamentStructure: TournamentStructureResponse;
  fixtures?: IFixture[];
  onNodeClick?: (nodeId: string, nodeType: string, data: any) => void;
  onCreateRound?: (sourceRoundId?: number) => void;
  onCreateGroup?: (roundId: number) => void;
  onAssignTeams?: (groupId: number) => void;
  onGenerateMatches?: (roundId: number) => void;
  onRefresh?: () => void;
}

// Register custom node types
const nodeTypes = {
  roundNode: RoundNode,
  groupNode: GroupNode,
  teamNode: TeamNode,
};

const flattenGroups = (groups: RoundGroupResponse[] = [], depth = 0): Array<RoundGroupResponse & { _depth: number }> => {
  const flattened: Array<RoundGroupResponse & { _depth: number }> = [];

  const walk = (items: RoundGroupResponse[], currentDepth: number) => {
    items.forEach((group) => {
      flattened.push({ ...group, _depth: currentDepth });
      if (group.childGroups && group.childGroups.length > 0) {
        walk(group.childGroups, currentDepth + 1);
      }
    });
  };

  walk(groups, depth);
  return flattened;
};

const normalizeRoundName = (name?: string) => (name || "").toLowerCase();

const extractLaneToken = (roundName?: string): string | null => {
  const normalized = normalizeRoundName(roundName);
  const laneTokens = ["cup", "plate", "bowl", "shield", "bronze", "silver", "gold"];
  const matchedToken = laneTokens.find((token) => normalized.includes(token));
  return matchedToken || null;
};

const resolveRoundSource = (
  rounds: TournamentStructureResponse["rounds"],
  currentRoundIndex: number
) => {
  const currentRound = rounds[currentRoundIndex];
  const previousRounds = rounds.slice(0, currentRoundIndex);
  const laneToken = extractLaneToken(currentRound.roundName);

  if (laneToken) {
    const matchingLaneRounds = previousRounds.filter((round) =>
      normalizeRoundName(round.roundName).includes(laneToken)
    );

    if (matchingLaneRounds.length > 0) {
      return matchingLaneRounds[matchingLaneRounds.length - 1];
    }
  }

  return previousRounds[previousRounds.length - 1];
};

const resolveLaneSourceGroup = (
  rounds: TournamentStructureResponse["rounds"],
  currentRoundIndex: number,
  laneToken: string
) => {
  const currentRound = rounds[currentRoundIndex];
  const normalizedCurrentRoundName = normalizeRoundName(currentRound?.roundName);
  const expectsSemifinalSource = normalizedCurrentRoundName.includes("final");

  for (let index = currentRoundIndex - 1; index >= 0; index -= 1) {
    const candidateRound = rounds[index];
    const candidateGroups = flattenGroups(candidateRound.groups || []);
    const laneGroups = candidateGroups.filter((group) =>
      normalizeRoundName(group.groupName).includes(laneToken)
    );

    if (laneGroups.length > 0) {
      const topLevelLaneGroups = laneGroups.filter(
        (group) => !group.parentGroupId && (group._depth ?? 0) === 0
      );

      if (expectsSemifinalSource) {
        const semifinalTopLevel = topLevelLaneGroups.find((group) =>
          normalizeRoundName(group.groupName).includes("semi")
        );
        if (semifinalTopLevel) {
          return semifinalTopLevel;
        }
      }

      if (topLevelLaneGroups.length > 0) {
        return topLevelLaneGroups[0];
      }

      return laneGroups[0];
    }
  }

  return null;
};

/**
 * TournamentFlowVisualization - Node-based tournament structure visualization
 *
 * Uses React Flow to display tournament rounds, groups, and teams as
 * an interactive flowchart with drag-and-drop, zoom, and pan controls.
 */
export default function TournamentFlowVisualization({
  tournamentStructure,
  fixtures = [],
  onNodeClick,
  onCreateRound,
  onCreateGroup,
  onAssignTeams,
  onGenerateMatches,
  onRefresh,
}: TournamentFlowVisualizationProps) {
  const { token } = useToken();
  const loginInfo = useSelector(selectLoginInfo);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if user can manage tournaments (ADMIN, SUPERADMIN)
  const canManage = hasAnyRole(loginInfo.roles, ["ADMIN", "SUPERADMIN"]);

  // Get background color from theme - use colorBgLayout for the main background
  // In dark mode it's #000000, in light mode it's #f0f2f5
  const backgroundColor = token.colorBgLayout || "#f5f5f5";
  // Determine if dark mode based on background color
  const isDarkMode =
    token.colorBgLayout === "#000000" || token.colorBgContainer === "#141414";

  // Generate nodes and edges from tournament structure (only when structure changes)
  // Use useMemo to create a stable structure identifier to prevent unnecessary re-renders
  // This prevents the visualization from blinking/resetting when data updates
  const structureKey = useMemo(() => {
    if (!tournamentStructure?.rounds) return "";
    return JSON.stringify({
      rounds: tournamentStructure.rounds.map((r) => ({
        id: r.id,
        roundName: r.roundName,
        roundType: r.roundType,
        groups:
          r.groups?.map((g) => ({
            id: g.id,
            groupName: g.groupName,
            teamCount: g.teams?.length || 0,
            totalMatches: g.totalMatches || 0,
          })) || [],
      })),
    });
  }, [tournamentStructure]);

  useEffect(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    const roundSpacing = 800; // Horizontal space between rounds (increased from 600 to spread nodes more)
    const groupSpacing = 500; // Vertical space between groups (increased from 380 to prevent overlap)
    const startX = 150; // Increased from 50 to give more left margin
    const startY = 200; // Increased from 100 to give more top margin

    tournamentStructure.rounds.forEach((round, roundIndex) => {
      const roundX = startX + roundIndex * roundSpacing;
      const roundY = startY;

      // Get ongoing matches for this round
      // Match by tournamentId, roundNumber (fixture.round or fixture.roundNumber), or round ID
      const roundOngoingMatches = fixtures.filter((f) => {
        // Ensure tournamentId matches
        const matchesTournament =
          f.tournamentId === tournamentStructure.tournamentId;
        if (!matchesTournament) return false;

        // Try multiple matching strategies for round
        const fixtureRoundNumber = f.roundNumber ?? f.round; // Use roundNumber if available, fallback to round
        const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
        const matchesByRoundId = f.round === round.id;
        const matches = matchesByRoundNumber || matchesByRoundId;

        // Check if match is ongoing
        const isOngoing = isMatchOngoing(f.matchStatus);

        return matches && isOngoing;
      });

      // Get all matches for this round (for standings calculation in DIRECT_KNOCKOUT rounds)
      const roundAllMatches = fixtures.filter((f) => {
        const matchesTournament =
          f.tournamentId === tournamentStructure.tournamentId;
        if (!matchesTournament) return false;
        const fixtureRoundNumber = f.roundNumber ?? f.round;
        const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
        const matchesByRoundId = f.round === round.id;
        return matchesByRoundNumber || matchesByRoundId;
      });

      // Create round node
      generatedNodes.push({
        id: `round-${round.id}`,
        type: "roundNode",
        position: { x: roundX, y: roundY },
        data: {
          roundName: round.roundName,
          roundType: round.roundType,
          status: round.status,
          totalMatches: round.totalMatches,
          completedMatches: round.completedMatches,
          sequenceOrder: round.sequenceOrder,
          roundId: round.id,
          groups: round.groups,
          teams: round.teams, // Pass teams for standings calculation
          ongoingMatches: roundOngoingMatches,
          allMatches: roundAllMatches, // Pass all matches for standings
          onCreateGroup: onCreateGroup,
          onCreateRound: onCreateRound,
        },
      });

      // Create group nodes for GROUP_BASED rounds
      if (round.roundType === "GROUP_BASED" && round.groups) {
        const flattenedGroups = flattenGroups(round.groups);

        flattenedGroups.forEach((group, groupIndex) => {
          // Position groups to the left of the round
          const groupX = roundX - 550 + group._depth * 260;
          const groupY = roundY + 300 + groupIndex * groupSpacing; // Increased vertical offset from 200

          // Get ongoing matches for this group
          // Match by tournamentId, groupName, and roundNumber
          const groupOngoingMatches = fixtures.filter((f) => {
            // Ensure tournamentId matches
            const matchesTournament =
              f.tournamentId === tournamentStructure.tournamentId;
            if (!matchesTournament) return false;

            // Match by groupName
            const matchesGroup = f.groupName === group.groupName;
            if (!matchesGroup) return false;

            // Try multiple matching strategies for round
            const fixtureRoundNumber = f.roundNumber ?? f.round; // Use roundNumber if available, fallback to round
            const matchesByRoundNumber =
              fixtureRoundNumber === round.roundNumber;
            const matchesByRoundId = f.round === round.id;
            const matchesRound = matchesByRoundNumber || matchesByRoundId;

            // Check if match is ongoing
            const isOngoing = isMatchOngoing(f.matchStatus);

            return matchesRound && isOngoing;
          });

          generatedNodes.push({
            id: `group-${group.id}`,
            type: "groupNode",
            position: { x: groupX, y: groupY },
            data: {
              groupName: group.groupName,
              teamCount: group.teams.length,
              maxTeams: group.maxTeams,
              totalMatches: group.totalMatches,
              completedMatches: group.completedMatches,
              status: group.status,
              groupId: group.id,
              teams: group.teams,
              matches: [], // Matches not available in tournament structure - would need separate fetch
              ongoingMatches: groupOngoingMatches, // Ongoing matches for display
              standings: group.standings || [], // Standings from group data
              onAssignTeams: onAssignTeams,
            },
            // Removed parentNode and extent to allow free movement
          });

          // Edge from round to group (connecting from left side of round to right side of group)
          if (group.parentGroupId) {
            generatedEdges.push({
              id: `edge-group-${group.parentGroupId}-group-${group.id}`,
              source: `group-${group.parentGroupId}`,
              sourceHandle: "right",
              target: `group-${group.id}`,
              targetHandle: "left",
              type: "smoothstep",
              animated: group.status === "ONGOING",
              style: {
                stroke: group.status === "COMPLETED" ? "#52c41a" : "#d9d9d9",
                strokeWidth: 3,
              },
            });
          } else {
            generatedEdges.push({
              id: `edge-round-${round.id}-group-${group.id}`,
              source: `round-${round.id}`,
              sourceHandle: "left-source", // Connect from left side of round
              target: `group-${group.id}`,
              targetHandle: "right", // Connect to right side of group
              type: "smoothstep",
              animated: group.status === "ONGOING",
              style: {
                stroke: group.status === "COMPLETED" ? "#52c41a" : "#d9d9d9",
                strokeWidth: 3, // Make edges larger
              },
            });
          }

        });
      }

      // Create edges between rounds (advancement connections) - from right to left
      if (roundIndex > 0) {
        const laneToken = extractLaneToken(round.roundName);

        if (laneToken) {
          const sourceGroup = resolveLaneSourceGroup(
            tournamentStructure.rounds,
            roundIndex,
            laneToken
          );

          if (sourceGroup) {
            generatedEdges.push({
              id: `edge-group-${sourceGroup.id}-round-${round.id}`,
              source: `group-${sourceGroup.id}`,
              sourceHandle: "right",
              target: `round-${round.id}`,
              targetHandle: "left",
              type: "smoothstep",
              animated: true,
              style: { stroke: "#13c2c2", strokeWidth: 3 },
              label: "Lane Advance",
              labelStyle: { fontSize: 12, fill: "#13c2c2" },
            });

            return;
          }
        }

        const previousRound = resolveRoundSource(tournamentStructure.rounds, roundIndex);

        if (!previousRound) {
          return;
        }

        generatedEdges.push({
          id: `edge-round-${previousRound.id}-round-${round.id}`,
          source: `round-${previousRound.id}`,
          sourceHandle: "right", // Connect from right side of previous round
          target: `round-${round.id}`,
          targetHandle: "left", // Connect to left side of current round
          type: "smoothstep",
          animated: true,
          style: { stroke: "#c6a15b", strokeWidth: 3 }, // Make edges larger
          label: "Advance",
          labelStyle: { fontSize: 12, fill: "#c6a15b" },
        });
      }
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [
    structureKey,
    fixtures,
    onCreateRound,
    onCreateGroup,
    onAssignTeams,
    onGenerateMatches,
    setNodes,
    setEdges,
    tournamentStructure,
  ]);

  const handleNodeClick = useCallback(
    (_event: any, node: Node) => {
      if (onNodeClick) {
        const nodeType = node.type || "unknown";
        onNodeClick(node.id, nodeType, node.data);
      }
    },
    [onNodeClick]
  );

  const handleResetView = useCallback(() => {
    // Reload nodes and edges
    setNodes((nds) => nds.map((n) => ({ ...n })));
  }, [setNodes]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerHeight = isFullscreen ? "100vh" : "100%";
  const minHeight = isFullscreen ? "100vh" : undefined;

  return (
    <div
      style={{
        height: containerHeight,
        minHeight: minHeight,
        width: "100%",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
        style={{ backgroundColor }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={isDarkMode ? "#434343" : "#d9d9d9"}
        />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{
            backgroundColor:
              token.colorBgElevated || (isDarkMode ? "#1f1f1f" : "#ffffff"),
            border: `1px solid ${
              token.colorBorder || (isDarkMode ? "#303030" : "#d9d9d9")
            }`,
          }}
        />

        {/* Custom Panel with Controls */}
        {canManage && (
          <Panel position="top-right">
            <Card size="small">
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space size={8} wrap>
                  {onCreateRound && (
                    <Tooltip title="Add Round">
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => onCreateRound()}
                      />
                    </Tooltip>
                  )}
                  <Tooltip
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    <Button
                      size="small"
                      icon={
                        isFullscreen ? <CompressOutlined /> : <ExpandOutlined />
                      }
                      onClick={toggleFullscreen}
                    />
                  </Tooltip>
                </Space>
              </Space>
            </Card>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
