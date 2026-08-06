import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../../state/store";
import {
  setSelectedNode,
  setShowRoundModal,
  setShowGroupModal,
  setShowTeamAssignment,
  setShowMatchGeneration,
  setShowRoundMatchGeneration,
  setShowDetailsDrawer,
  closeAllModals,
} from "../../../../../state/features/manualFixtures/manualFixturesUISlice";
import { MatchDayStructureResponse, RoundStatus, RoundType } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import MatchDayFlowVisualization from "../MatchDayFlowVisualization";
import RoundManagement from "../RoundManagement";
import GroupManagement from "../GroupManagement";
import TeamAssignment from "../TeamAssignment";
import GroupMatchGenerationModal from "../GroupMatchGenerationModal";
import RoundMatchGenerationModal from "../RoundMatchGenerationModal";
import {
  useDeleteRoundMutation,
  useDeleteGroupMutation,
  useStartRoundMutation,
  useCompleteRoundMutation,
  useGetGroupStandingsQuery,
  useCreateGroupMutation,
  useRemoveTeamFromGroupMutation,
  useRemoveTeamFromRoundMutation,
} from "../../../../../state/features/manualFixtures/manualFixturesSlice";
import { useGetFixturesQuery } from "../../../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";
import { formatMatchTime, isMatchOngoing } from "../../../../../utils/matchTimeUtils";
import { GroupFormat } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { useNavigate } from "react-router-dom";
import { useGetMatchDaySummaryQuery } from "../../../../../state/features/matchDays/matchDaysSlice";
import { useGetVanuesQuery } from "../../../../../state/features/vanues/vanuesSlice";
import { selectLoginInfo } from "../../../../../state/slices/loginInfoSlice";
import { hasAnyRole } from "../../../../../utils/roleUtils";
import { RoundGroupResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import Button from "../../../../ui/button";
import Badge from "../../../../ui/badge";
import Modal from "../../../../ui/modal";

interface InteractiveMatchDayTabProps {
  matchDayId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  matchDayStructure?: MatchDayStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
  isActive?: boolean;
}

interface TeamAssignmentContext {
  groupId: number | null;
  roundId: number | null;
  roundType?: "GROUP_BASED" | "DIRECT_KNOCKOUT";
}

interface RoundCreateContext {
  sourceRoundName?: string;
  sourceGroupName?: string;
  suggestedRoundName?: string;
  suggestedRoundType?: RoundType;
}

const flattenGroups = (groups: RoundGroupResponse[] = []): RoundGroupResponse[] => {
  const result: RoundGroupResponse[] = [];

  const walk = (items: RoundGroupResponse[]) => {
    items.forEach((group) => {
      result.push(group);
      if (group.childGroups && group.childGroups.length > 0) {
        walk(group.childGroups);
      }
    });
  };

  walk(groups);
  return result;
};

const findGroupById = (groups: RoundGroupResponse[] = [], groupId: number): RoundGroupResponse | null => {
  for (const group of groups) {
    if (group.id === groupId) return group;
    if (group.childGroups && group.childGroups.length > 0) {
      const found = findGroupById(group.childGroups, groupId);
      if (found) return found;
    }
  }
  return null;
};

const statusBadgeVariant = (status: RoundStatus): "info" | "warning" | "success" => {
  switch (status) {
    case RoundStatus.NOT_STARTED:
      return "info";
    case RoundStatus.ONGOING:
      return "warning";
    case RoundStatus.COMPLETED:
      return "success";
  }
};

const statusIcon = (status: RoundStatus) => {
  switch (status) {
    case RoundStatus.NOT_STARTED:
      return <ClockCircleOutlined />;
    case RoundStatus.ONGOING:
      return <PlayCircleOutlined />;
    case RoundStatus.COMPLETED:
      return <CheckCircleOutlined />;
  }
};

function MiniStandingsTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-theme-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="px-2 py-1.5 text-left font-semibold text-gray-500 dark:text-gray-400">Pos</th>
            <th className="px-2 py-1.5 text-left font-semibold text-gray-500 dark:text-gray-400">Team</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">P</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">W</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">D</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">L</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">GF</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">GA</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">GD</th>
            <th className="px-2 py-1.5 text-center font-semibold text-gray-500 dark:text-gray-400">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((standing) => (
            <tr key={standing.id ?? standing.teamId}>
              <td className="px-2 py-1.5">{standing.position}</td>
              <td className="px-2 py-1.5 font-medium text-gray-800 dark:text-white/90">{standing.teamName}</td>
              <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-300">{standing.matchesPlayed}</td>
              <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-300">{standing.wins}</td>
              <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-300">{standing.draws}</td>
              <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-300">{standing.losses}</td>
              <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-300">{standing.goalsFor}</td>
              <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-300">{standing.goalsAgainst}</td>
              <td className={`px-2 py-1.5 text-center font-semibold ${standing.goalDifference > 0 ? "text-success-600" : standing.goalDifference < 0 ? "text-error-600" : "text-gray-600"}`}>
                {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
              </td>
              <td className="px-2 py-1.5 text-center font-bold text-gray-800 dark:text-white/90">{standing.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveMatchList({ matches, currentTime, onNavigate }: { matches: IFixture[]; currentTime: number; onNavigate: (id: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {matches.map((match: IFixture) => {
        const _ = currentTime;
        const matchTime = formatMatchTime(match.matchStatus, match.startedAt, match.elapsedTimeSeconds, match.completedAt);
        return (
          <div
            key={match.id}
            onClick={() => onNavigate(match.id)}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-success-500/40 bg-success-50 px-4 py-2.5 dark:bg-success-500/10"
          >
            <span className="flex items-center gap-2.5">
              <PlayCircleOutlined className="text-success-500" />
              <span className="font-semibold text-gray-800 dark:text-white/90">{match.homeTeamName}</span>
              <span className="text-base font-bold text-gray-800 dark:text-white/90">{match.homeTeamScore} - {match.awayTeamScore}</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">{match.awayTeamName}</span>
            </span>
            {matchTime && (
              <span onClick={(e) => { e.stopPropagation(); onNavigate(match.id); }} className="rounded-full bg-success-500 px-3 py-1 text-theme-sm font-bold text-white">
                {matchTime}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function InteractiveMatchDayTab({
  matchDayId,
  teams,
  matchDayStructure,
  isLoading,
  onRefresh,
  isActive = false,
}: InteractiveMatchDayTabProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [teamAssignmentContext, setTeamAssignmentContext] = useState<TeamAssignmentContext>({
    groupId: null,
    roundId: null,
    roundType: undefined,
  });
  const [roundCreateContext, setRoundCreateContext] = useState<RoundCreateContext | null>(null);
  const loginInfo = useSelector(selectLoginInfo);

  const canManage = hasAnyRole(loginInfo.roles, ["ADMIN", "SUPERADMIN", "COORDINATOR"]);

  const {
    selectedNode,
    showRoundModal,
    showGroupModal,
    showTeamAssignment,
    showMatchGeneration,
    showRoundMatchGeneration,
    showDetailsDrawer,
  } = useSelector((state: RootState) => state.manualFixturesUI);

  const [deleteRound] = useDeleteRoundMutation();
  const [deleteGroup] = useDeleteGroupMutation();
  const [startRound, { isLoading: isStartingRound }] = useStartRoundMutation();
  const [completeRound, { isLoading: isCompletingRound }] = useCompleteRoundMutation();
  const [removeTeamFromGroup, { isLoading: isRemovingTeam }] = useRemoveTeamFromGroupMutation();
  const [removeTeamFromRound] = useRemoveTeamFromRoundMutation();
  const [createGroup] = useCreateGroupMutation();

  const { data: standingsData } = useGetGroupStandingsQuery(
    { groupId: selectedNode?.type === "group" ? selectedNode.id : 0 },
    { skip: selectedNode?.type !== "group" || !selectedNode.id }
  );

  const { data: fixturesData, refetch: refetchFixtures } = useGetFixturesQuery(
    { matchDayId },
    { skip: !isActive }
  );
  const fixtures = fixturesData?.content || [];

  const { data: matchDaySummary } = useGetMatchDaySummaryQuery(
    { matchDayId },
    { skip: !matchDayId }
  );

  const { data: venuesData } = useGetVanuesQuery();
  const venues = venuesData?.content || [];

  const matchDayVenueName = matchDaySummary?.content?.[0]?.venueName;
  const matchDayVenueId = matchDayVenueName
    ? venues.find((v) => v.name === matchDayVenueName)?.id || null
    : null;

  const hasOngoingMatches = fixtures.some(
    (f) => f.matchStatus === "ONGOING" || f.matchStatus === "PAUSED"
  );

  useEffect(() => {
    if (!hasOngoingMatches || !isActive) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [hasOngoingMatches, isActive]);

  useEffect(() => {
    if (isActive) {
      refetchFixtures();
    }
  }, [isActive, refetchFixtures]);

  useEffect(() => {
    if (!selectedNode && showDetailsDrawer) {
      dispatch(setShowDetailsDrawer(false));
    }
  }, [selectedNode, showDetailsDrawer, dispatch]);

  const finalFixtures = fixtures;

  const handleNodeClick = useCallback((nodeId: string, nodeType: string, data: any) => {
    if (nodeType === "roundNode") {
      const roundId = parseInt(nodeId.replace("round-", ""));
      const round = matchDayStructure?.rounds.find((r) => r.id === roundId);
      if (round) {
        dispatch(setSelectedNode({
          type: "round",
          id: roundId,
          data: round,
        }));
        dispatch(setShowDetailsDrawer(true));
      }
    } else if (nodeType === "groupNode") {
      const groupId = parseInt(nodeId.replace("group-", ""));
      const round = matchDayStructure?.rounds.find((r) =>
        flattenGroups(r.groups || []).some((g) => g.id === groupId)
      );
      const group = round ? findGroupById(round.groups || [], groupId) : null;
      if (group && round) {
        dispatch(setSelectedNode({
          type: "group",
          id: groupId,
          data: { ...group, roundId: round.id },
        }));
        dispatch(setShowDetailsDrawer(true));
      }
    }
  }, [matchDayStructure, dispatch]);

  const handleCreateRound = (sourceRoundId?: number, sourceGroupId?: number) => {
    let nextContext: RoundCreateContext | null = null;

    if (sourceRoundId) {
      const sourceRound = matchDayStructure?.rounds.find((r) => r.id === sourceRoundId);
      if (sourceRound) {
        let suggestedRoundName = `Round ${sourceRound.sequenceOrder + 1}`;
        let suggestedRoundType = sourceRound.roundType;

        if (sourceRound.roundType === RoundType.GROUP_BASED) {
          suggestedRoundName = `Knockout Stage`;
          suggestedRoundType = RoundType.DIRECT_KNOCKOUT;
        }

        if (sourceGroupId) {
          const sourceGroup = findGroupById(sourceRound.groups || [], sourceGroupId);
          if (sourceGroup) {
            suggestedRoundName = `${sourceGroup.groupName} - Next Stage`;
            nextContext = {
              sourceRoundName: sourceRound.roundName,
              sourceGroupName: sourceGroup.groupName,
              suggestedRoundName,
              suggestedRoundType,
            };
          }
        }

        if (!nextContext) {
          nextContext = {
            sourceRoundName: sourceRound.roundName,
            suggestedRoundName,
            suggestedRoundType,
          };
        }
      }
    }

    setRoundCreateContext(nextContext);
    dispatch(setSelectedNode(null));
    dispatch(setShowRoundModal(true));
  };

  const handleEditRound = (roundId?: number) => {
    if (roundId) {
      dispatch(setSelectedNode({ type: "round", id: roundId, data: {} }));
    }
    dispatch(setShowRoundModal(true));
  };

  const handleDeleteRound = async (roundId: number) => {
    try {
      dispatch(closeAllModals());

      await deleteRound({ roundId }).unwrap();
      toast.success("Round deleted successfully");
      onRefresh();
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleStartRound = async (roundId: number) => {
    try {
      await startRound({ roundId }).unwrap();
      toast.success("Round started successfully");
      dispatch(setSelectedNode(null));
      onRefresh();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        "Failed to start round";

      toast.error(errorMessage);
    }
  };

  const handleCompleteRound = async (roundId: number) => {
    const round = matchDayStructure?.rounds.find((r) => r.id === roundId);
    if (!round) return;

    const allMatchesCompleted = round.totalMatches > 0 && round.completedMatches === round.totalMatches;

    if (round.roundType === RoundType.GROUP_BASED && round.groups) {
      const leafGroups = flattenGroups(round.groups).filter(
        (group) => !group.childGroups || group.childGroups.length === 0
      );

      const allGroupsCompleted = leafGroups.every((group) => {
        return group.totalMatches > 0 && group.completedMatches === group.totalMatches;
      });

      if (!allGroupsCompleted) {
        const incompleteGroups = leafGroups.filter(
          (group) => !(group.totalMatches > 0 && group.completedMatches === group.totalMatches)
        );
        toast.error(
          `Cannot complete round. The following groups have incomplete matches: ${incompleteGroups.map(g => g.groupName).join(", ")}`
        );
        return;
      }
    }

    if (!allMatchesCompleted) {
      toast.error(
        `Cannot complete round. Progress: ${round.completedMatches} / ${round.totalMatches} matches completed.`
      );
      return;
    }

    try {
      await completeRound({
        roundId,
        recalculateStandings: true,
      }).unwrap();
      toast.success("Round completed successfully");
      dispatch(setSelectedNode(null));
      dispatch(setShowDetailsDrawer(false));
      onRefresh();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to complete round. Please ensure all matches are completed.";
      toast.error(errorMessage);
    }
  };

  const handleCreateGroup = async (roundId: number, parentGroupId?: number) => {
    const round = matchDayStructure?.rounds.find((r) => r.id === roundId);
    if (!round || round.roundType !== RoundType.GROUP_BASED) return;

    const existingGroups = flattenGroups(round.groups || []);
    let groupName = "";

    if (parentGroupId) {
      const parentGroup = existingGroups.find((g) => g.id === parentGroupId);
      const existingSubgroups = existingGroups.filter((g) => g.parentGroupId === parentGroupId);
      const subgroupIndex = existingSubgroups.length + 1;
      groupName = parentGroup
        ? `${parentGroup.groupName} - Subgroup ${subgroupIndex}`
        : `Subgroup ${subgroupIndex}`;
    } else {
      const groupLetters = existingGroups
        .map((g) => g.groupName)
        .filter((name) => /^Group [A-Z]$/.test(name));
      const nextLetter = String.fromCharCode(65 + groupLetters.length);
      groupName = `Group ${nextLetter}`;
    }

    try {
      await createGroup({
        roundId,
        ...(parentGroupId ? { parentGroupId } : {}),
        groupName,
        groupFormat: GroupFormat.ROUND_ROBIN_SINGLE,
        maxTeams: 4,
      }).unwrap();
      toast.success(parentGroupId ? "Subgroup created successfully" : `${groupName} created successfully`);
      setTimeout(() => {
        onRefresh();
      }, 100);
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleEditGroup = (groupId: number, roundId: number) => {
    dispatch(setSelectedNode({ type: "group", id: groupId, data: { roundId } }));
    dispatch(setShowGroupModal(true));
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      dispatch(setShowDetailsDrawer(false));
      dispatch(setSelectedNode(null));

      await deleteGroup({ groupId }).unwrap();
      toast.success("Group deleted successfully");
      onRefresh();
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const [confirmRemoveTeam, setConfirmRemoveTeam] = useState<{ teamId: number; teamName?: string } | null>(null);

  const handleRemoveTeamFromRound = (teamId: number, teamName?: string) => {
    if (!selectedNode || selectedNode.type !== "round") {
      toast.error("No round selected");
      return;
    }
    const round = matchDayStructure?.rounds.find((r) => r.id === selectedNode.id);
    if (!round) {
      toast.error("Round not found");
      return;
    }
    setConfirmRemoveTeam({ teamId, teamName });
  };

  const confirmRemoveTeamFromRound = async () => {
    if (!confirmRemoveTeam || !selectedNode) return;
    const round = matchDayStructure?.rounds.find((r) => r.id === selectedNode.id);
    if (!round) return;
    try {
      await removeTeamFromRound({ roundId: round.id, teamId: confirmRemoveTeam.teamId }).unwrap();
      toast.success(`Team "${confirmRemoveTeam.teamName || 'Team'}" removed successfully`);
      onRefresh();
    } catch (error: any) {
      console.error("Failed to remove team:", error);
    }
    setConfirmRemoveTeam(null);
  };

  const handleRemoveTeamFromGroup = async (groupId: number, teamId: number, teamName?: string) => {
    try {
      await removeTeamFromGroup({ groupId, teamId }).unwrap();
      toast.success(`Team "${teamName || 'Team'}" removed successfully`);
      setTimeout(() => {
        onRefresh();
      }, 100);
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleAssignTeams = (groupId: number) => {
    const round = matchDayStructure?.rounds.find((r) =>
      flattenGroups(r.groups || []).some((g) => g.id === groupId)
    );
    const group = round ? findGroupById(round.groups || [], groupId) : null;

    if (group && round) {
      const hasTeams = group.teams && group.teams.filter((t: any) => !t.isPlaceholder).length > 0;
      if (hasTeams) {
        toast.warning("Teams already assigned to this group. Remove existing teams first.");
        return;
      }

      dispatch(setSelectedNode({ type: "group", id: groupId, data: { ...group, roundId: round.id } }));
      setTeamAssignmentContext({
        groupId,
        roundId: round.id,
        roundType: "GROUP_BASED",
      });
      dispatch(setShowTeamAssignment(true));
    }
  };

  const handleGenerateMatches = (groupId: number, groupName: string, teamCount: number) => {
    const round = matchDayStructure?.rounds.find((r) =>
      flattenGroups(r.groups || []).some((g) => g.id === groupId)
    );
    const group = round ? findGroupById(round.groups || [], groupId) : null;
    if (group && round) {
      dispatch(setSelectedNode({
        type: "group",
        id: groupId,
        data: {
          groupName,
          teamCount,
          roundId: round.id
        }
      }));
    } else {
      dispatch(setSelectedNode({ type: "group", id: groupId, data: { groupName, teamCount } }));
    }
    dispatch(setShowMatchGeneration(true));
  };

  const handleGenerateRoundMatches = (roundId: number) => {
    const round = matchDayStructure?.rounds.find((r) => r.id === roundId);
    if (!round) return;

    if (round.roundType === RoundType.GROUP_BASED) {
      const groups = round.groups || [];
      if (groups.length === 0) {
        toast.warning("No groups found in this round. Create groups first.");
        return;
      }

      const groupsWithEnoughTeams = groups.filter((g: any) => {
        const teamCount = g.teams?.filter((t: any) => !t.isPlaceholder).length || 0;
        return teamCount >= 2;
      });

      if (groupsWithEnoughTeams.length === 0) {
        toast.warning("No groups have enough teams (minimum 2) to generate matches.");
        return;
      }

      toast.info(`This will generate matches for ${groupsWithEnoughTeams.length} group(s). Please generate matches for each group individually from Group Details.`);
    } else {
      dispatch(setSelectedNode({ type: "round", id: roundId, data: round }));
      dispatch(setShowRoundMatchGeneration(true));
    }
  };

  const renderRoundDetails = () => {
    if (!selectedNode || selectedNode.type !== "round") return null;

    const round = matchDayStructure?.rounds.find((r) => r.id === selectedNode.id);
    if (!round) return null;

    const roundOngoingMatches = finalFixtures.filter((f) => {
      const matchesMatchDay = f.matchDayId === matchDayId;
      if (!matchesMatchDay) return false;

      const fixtureRoundNumber = f.roundNumber ?? f.round;
      const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
      const matchesByRoundId = f.round === round.id;
      const matchesRound = matchesByRoundNumber || matchesByRoundId;

      const isOngoing = isMatchOngoing(f.matchStatus);

      return matchesRound && isOngoing;
    });

    const isGroupBased = round.roundType === RoundType.GROUP_BASED;
    const canStart = round.status === RoundStatus.NOT_STARTED;
    const allMatchesCompleted = round.totalMatches > 0 && round.completedMatches === round.totalMatches;
    const canComplete = round.status === RoundStatus.ONGOING && allMatchesCompleted;

    const roundMatches = finalFixtures.filter((f) => {
      const matchesMatchDay = f.matchDayId === matchDayId;
      if (!matchesMatchDay) return false;
      const fixtureRoundNumber = f.roundNumber ?? f.round;
      const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
      const matchesByRoundId = f.round === round.id;
      return matchesByRoundNumber || matchesByRoundId;
    });

    const calculateRoundStandings = () => {
      if (isGroupBased || roundMatches.length === 0) return [];

      const teamStats: Record<number, {
        teamId: number;
        teamName: string;
        matchesPlayed: number;
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDifference: number;
        points: number;
      }> = {};

      if (round.teams) {
        round.teams.forEach((team: any) => {
          if (!team.isPlaceholder && team.teamId) {
            teamStats[team.teamId] = {
              teamId: team.teamId,
              teamName: team.teamName || "",
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
            };
          }
        });
      }

      roundMatches.forEach((match) => {
        if (match.matchStatus !== "COMPLETED") return;

        const homeTeamId = match.homeTeamId;
        const awayTeamId = match.awayTeamId;
        const homeScore = match.homeTeamScore || 0;
        const awayScore = match.awayTeamScore || 0;

        if (!teamStats[homeTeamId]) {
          teamStats[homeTeamId] = {
            teamId: homeTeamId,
            teamName: match.homeTeamName || `Team ${homeTeamId}`,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          };
        }

        if (!teamStats[awayTeamId]) {
          teamStats[awayTeamId] = {
            teamId: awayTeamId,
            teamName: match.awayTeamName || `Team ${awayTeamId}`,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          };
        }

        if (teamStats[homeTeamId]) {
          teamStats[homeTeamId].matchesPlayed++;
          teamStats[homeTeamId].goalsFor += homeScore;
          teamStats[homeTeamId].goalsAgainst += awayScore;
          teamStats[homeTeamId].goalDifference = teamStats[homeTeamId].goalsFor - teamStats[homeTeamId].goalsAgainst;

          if (homeScore > awayScore) {
            teamStats[homeTeamId].wins++;
            teamStats[homeTeamId].points += 3;
          } else if (homeScore === awayScore) {
            teamStats[homeTeamId].draws++;
            teamStats[homeTeamId].points += 1;
          } else {
            teamStats[homeTeamId].losses++;
          }
        }

        if (teamStats[awayTeamId]) {
          teamStats[awayTeamId].matchesPlayed++;
          teamStats[awayTeamId].goalsFor += awayScore;
          teamStats[awayTeamId].goalsAgainst += homeScore;
          teamStats[awayTeamId].goalDifference = teamStats[awayTeamId].goalsFor - teamStats[awayTeamId].goalsAgainst;

          if (awayScore > homeScore) {
            teamStats[awayTeamId].wins++;
            teamStats[awayTeamId].points += 3;
          } else if (awayScore === homeScore) {
            teamStats[awayTeamId].draws++;
            teamStats[awayTeamId].points += 1;
          } else {
            teamStats[awayTeamId].losses++;
          }
        }
      });

      const standings = Object.values(teamStats)
        .filter((stat) => stat.matchesPlayed > 0)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        })
        .map((stat, index) => ({
          ...stat,
          position: index + 1,
          id: stat.teamId,
        }));

      return standings;
    };

    const roundStandings = !isGroupBased ? calculateRoundStandings() : [];

    const feederRounds = (round.sourceRoundIds ?? [])
      .map((id) => matchDayStructure?.rounds.find((r) => r.id === id))
      .filter((r): r is typeof round => !!r);

    const incompleteFeeders = feederRounds.filter(
      (r) => r.status !== RoundStatus.COMPLETED
    );

    const previousRound = feederRounds.length > 0
      ? feederRounds[0]
      : round.sequenceOrder && round.sequenceOrder > 1
      ? matchDayStructure?.rounds.find((r) => r.sequenceOrder === round.sequenceOrder - 1)
      : null;

    const hasGroups = isGroupBased && round.groups && round.groups.length > 0;
    const hasTeams = !isGroupBased && round.teams && round.teams.length > 0;
    const hasRequiredStructure = isGroupBased ? hasGroups : hasTeams;

    const hasGroupMatches = isGroupBased && hasGroups
      ? flattenGroups(round.groups!).some((group) => (group.totalMatches || 0) > 0)
      : true;

    const hasRoundMatches = !isGroupBased
      ? (round.totalMatches || 0) > 0
      : true;

    const hasMatches = isGroupBased ? hasGroupMatches : hasRoundMatches;

    const canStartRound = canStart &&
      incompleteFeeders.length === 0 &&
      hasRequiredStructure &&
      hasMatches;

    const startRoundReason = !canStart
      ? `Round is already ${round.status}`
      : incompleteFeeders.length > 0
      ? `Feeder round "${incompleteFeeders[0].roundName}" must be completed first`
      : !hasRequiredStructure
      ? isGroupBased
        ? "Round must have at least one group before it can be started"
        : "Round must have at least one team before it can be started"
      : !hasMatches
      ? isGroupBased
        ? "You must generate matches for the groups in this round before starting it"
        : "You must generate matches for this round before starting it"
      : null;

    return (
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="mb-1.5 text-lg font-bold text-gray-800 dark:text-white/90">{round.roundName}</h4>
          <div className="flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
            <Badge variant={statusBadgeVariant(round.status)}>{statusIcon(round.status)} {round.status}</Badge>
            <span>Sequence: {round.sequenceOrder}</span>
            <span>Matches: {round.completedMatches} / {round.totalMatches}</span>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div className="text-theme-sm text-gray-600 dark:text-gray-300">Type: <strong>{round.roundType}</strong></div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div className="flex flex-col gap-2.5">
          {canManage && canStart && (
            <>
              <Button type="button" className="w-full" startIcon={<PlayCircleOutlined />} disabled={!canStartRound || isStartingRound} title={startRoundReason || undefined} onClick={() => handleStartRound(round.id)}>
                Start Round
              </Button>
              {startRoundReason && (
                <div className="rounded-lg border border-warning-500/30 bg-warning-50 px-3 py-2 text-theme-xs text-warning-700 dark:bg-warning-500/10 dark:text-orange-300">{startRoundReason}</div>
              )}
            </>
          )}

          {canManage && canComplete && (
            <>
              <Button type="button" className="w-full" startIcon={<CheckCircleOutlined />} disabled={(!allMatchesCompleted && round.status === RoundStatus.ONGOING) || isCompletingRound} onClick={() => handleCompleteRound(round.id)}>
                Complete Round
              </Button>
              {round.status === RoundStatus.ONGOING && !allMatchesCompleted && (
                <div className="rounded-lg border border-warning-500/30 bg-warning-50 px-3 py-2 text-theme-xs text-warning-700 dark:bg-warning-500/10 dark:text-orange-300">
                  All matches must be completed first. Progress: {round.completedMatches} / {round.totalMatches} matches completed.
                </div>
              )}
            </>
          )}

          {canManage && isGroupBased && round.sequenceOrder && round.sequenceOrder > 1 && previousRound && previousRound.status === RoundStatus.COMPLETED && (
            <Button type="button" variant="outline" className="w-full" startIcon={<UserAddOutlined />} onClick={() => toast.info("Please select a group first, then use 'Assign Teams' to import teams from the previous round")}>
              Import Teams from Previous Round
            </Button>
          )}

          {canManage && isGroupBased && round.sequenceOrder && round.sequenceOrder > 1 && previousRound && previousRound.status !== RoundStatus.COMPLETED && (
            <div className="rounded-lg border border-blue-light-500/30 bg-blue-light-50 px-3 py-2 text-theme-xs text-blue-light-700">
              Previous round "{previousRound.roundName}" must be completed first before importing teams.
            </div>
          )}

          {canManage && (
            <>
              <Button type="button" variant="outline" className="w-full" startIcon={<EditOutlined />} onClick={() => handleEditRound(round.id)}>
                Edit Round
              </Button>

              <Button type="button" variant="outline" className="w-full" startIcon={<PlusOutlined />} onClick={() => handleCreateRound(round.id)}>
                Create Next Round from This Round
              </Button>

              {isGroupBased && (
                <Button type="button" variant="outline" className="w-full" startIcon={<PlusOutlined />} onClick={() => handleCreateGroup(round.id)}>
                  Add Group
                </Button>
              )}

              {!isGroupBased && canStart && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    startIcon={<UserAddOutlined />}
                    onClick={() => {
                      dispatch(setSelectedNode({ type: "round", id: round.id, data: round }));
                      setTeamAssignmentContext({
                        groupId: null,
                        roundId: round.id,
                        roundType: round.roundType as "GROUP_BASED" | "DIRECT_KNOCKOUT",
                      });
                      dispatch(setShowTeamAssignment(true));
                    }}
                  >
                    {round.sequenceOrder && round.sequenceOrder > 1 && previousRound && previousRound.status === RoundStatus.COMPLETED
                      ? "Import/Assign Teams"
                      : "Assign Teams"}
                  </Button>
                  {round.teams && round.teams.length >= 2 && round.totalMatches === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      startIcon={<ThunderboltOutlined />}
                      onClick={() => {
                        dispatch(setSelectedNode({ type: "round", id: round.id, data: round }));
                        dispatch(setShowRoundMatchGeneration(true));
                      }}
                    >
                      Generate Matches
                    </Button>
                  )}
                </>
              )}

              <Button type="button" variant="danger" className="w-full" startIcon={<DeleteOutlined />} onClick={() => handleDeleteRound(round.id)}>
                Delete Round
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-gray-100 pt-3 text-theme-sm font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
          <TeamOutlined /> Assigned Teams
        </div>

        {isGroupBased ? (
          round.groups && round.groups.length > 0 ? (
            <div className="flex flex-col gap-3">
              {round.groups.map((group) => {
                const groupTeams = (group.teams || [])
                  .filter((t: any) => {
                    const hasIdentifier = (t.teamId !== null && t.teamId !== undefined) || (t.id !== null && t.id !== undefined);
                    const isNotPlaceholder = !t.isPlaceholder;
                    return hasIdentifier && isNotPlaceholder;
                  })
                  .map((t: any) => {
                    const identifier = t.teamId ?? t.id;
                    return {
                      teamId: identifier,
                      id: identifier,
                      teamName: t.teamName || `Team ${identifier}`,
                    };
                  });

                return (
                  <div key={group.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{group.groupName}</span>
                      <Badge variant="info">{groupTeams.length} team{groupTeams.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    {groupTeams.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {groupTeams.map((team: any) => <Badge key={team.teamId || team.id} variant="light">{team.teamName}</Badge>)}
                      </div>
                    ) : (
                      <p className="text-theme-xs text-gray-400">No teams assigned</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-theme-sm text-gray-400">No groups created yet</p>
          )
        ) : (
          (() => {
            const assignedTeams = (round.teams || [])
              .filter((t: any) => {
                const hasIdentifier = (t.teamId !== null && t.teamId !== undefined) || (t.id !== null && t.id !== undefined);
                const isNotPlaceholder = !t.isPlaceholder;
                return hasIdentifier && isNotPlaceholder;
              })
              .map((t: any) => {
                const identifier = t.teamId ?? t.id;
                return {
                  teamId: identifier,
                  id: identifier,
                  teamName: t.teamName || `Team ${identifier}`,
                };
              });

            return assignedTeams.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {assignedTeams.map((team: any) => (
                  <button
                    key={team.teamId || team.id}
                    type="button"
                    onClick={() => handleRemoveTeamFromRound(team.teamId || team.id, team.teamName)}
                    className="flex items-center gap-1.5 rounded-full border border-gray-300 px-2.5 py-1 text-theme-xs text-gray-700 hover:border-error-400 hover:text-error-500 dark:border-gray-700 dark:text-gray-300"
                  >
                    {team.teamName} ×
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-theme-sm text-gray-400">No teams assigned to this round</p>
            );
          })()
        )}

        {!isGroupBased && (
          <>
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                <BarChartOutlined /> Standings
              </div>
              {roundStandings.length > 0 ? (
                <MiniStandingsTable rows={roundStandings} />
              ) : (
                <p className="text-theme-xs text-gray-400">
                  {roundMatches.length === 0
                    ? "No matches found for this round. Generate matches to see standings."
                    : "No completed matches yet. Complete some matches to see standings."}
                </p>
              )}
            </div>
          </>
        )}

        {roundOngoingMatches.length > 0 && (
          <>
            <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Live Matches ({roundOngoingMatches.length})</div>
            <LiveMatchList matches={roundOngoingMatches} currentTime={currentTime} onNavigate={(id) => navigate(`/fixtures/${id}`)} />
          </>
        )}

        {isGroupBased && round.groups && round.groups.length > 0 && (
          <>
            <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Groups ({round.groups.length})</div>
            <div className="flex flex-col gap-2">
              {round.groups.map((group) => (
                <div key={group.id} className="rounded-xl border border-gray-100 p-2.5 dark:border-gray-800">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{group.groupName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(setSelectedNode({
                          type: "group",
                          id: group.id,
                          data: { ...group, roundId: round.id },
                        }));
                      }}
                      className="text-theme-xs font-medium text-brand-500 hover:underline"
                    >
                      View
                    </button>
                  </div>
                  <div className="flex gap-3 text-theme-xs text-gray-400">
                    <span>Teams: {group.teams.length}</span>
                    <span>Matches: {group.completedMatches} / {group.totalMatches}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const [confirmRemoveGroupTeam, setConfirmRemoveGroupTeam] = useState<{ teamId: number; teamName?: string } | null>(null);

  const renderGroupDetails = () => {
    if (!selectedNode || selectedNode.type !== "group") return null;

    const round = matchDayStructure?.rounds.find((r) =>
      flattenGroups(r.groups || []).some((g) => g.id === selectedNode.id)
    );
    const group = round ? findGroupById(round.groups || [], selectedNode.id) : null;
    if (!round || !group) return null;

    const groupOngoingMatches = finalFixtures.filter((f) => {
      const matchesMatchDay = f.matchDayId === matchDayId;
      if (!matchesMatchDay) return false;

      const matchesGroup = f.groupName === group.groupName;
      if (!matchesGroup) return false;

      const fixtureRoundNumber = f.roundNumber ?? f.round;
      const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
      const matchesByRoundId = f.round === round.id;
      const matchesRound = matchesByRoundNumber || matchesByRoundId;

      const isOngoing = isMatchOngoing(f.matchStatus);

      return matchesRound && isOngoing;
    });

    const teamCount = group.teams?.filter((t: any) => !t.isPlaceholder).length || 0;
    const canGenerateMatches = teamCount >= 2;

    const standings = standingsData?.content || [];

    return (
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="mb-1.5 text-lg font-bold text-gray-800 dark:text-white/90">{group.groupName}</h4>
          <div className="flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
            <Badge variant={statusBadgeVariant(group.status)}>{statusIcon(group.status)} {group.status}</Badge>
            <span>Teams: {teamCount}</span>
            <span>Matches: {group.completedMatches} / {group.totalMatches}</span>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div className="flex flex-col gap-2.5">
          <Button type="button" className="w-full" startIcon={<ThunderboltOutlined />} disabled={!canGenerateMatches} onClick={() => handleGenerateMatches(selectedNode.id, group.groupName, teamCount)}>
            Generate Matches
          </Button>

          <Button type="button" variant="outline" className="w-full" startIcon={<UserAddOutlined />} onClick={() => handleAssignTeams(selectedNode.id)}>
            Assign Teams
          </Button>

          <Button type="button" variant="outline" className="w-full" startIcon={<EditOutlined />} onClick={() => handleEditGroup(selectedNode.id, group.roundId)}>
            Edit Group
          </Button>

          <Button type="button" variant="outline" className="w-full" startIcon={<PlusOutlined />} onClick={() => handleCreateGroup(group.roundId, group.id)}>
            Add Subgroup
          </Button>

          <Button type="button" variant="outline" className="w-full" startIcon={<PlusOutlined />} onClick={() => handleCreateRound(group.roundId, group.id)}>
            Create Next Round from This Group
          </Button>

          <Button type="button" variant="danger" className="w-full" startIcon={<DeleteOutlined />} onClick={() => handleDeleteGroup(selectedNode.id)}>
            Delete Group
          </Button>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div>
          <h5 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Teams ({group.teams?.length || 0})</h5>
          <div className="flex flex-col gap-2">
            {group.teams?.map((team: any, idx: number) => {
              const isPlaceholder = team.isPlaceholder || false;
              const teamId = team.teamId ?? team.id;

              return (
                <div key={team.id || idx} className={`flex items-center justify-between rounded-xl border p-2.5 ${isPlaceholder ? "border-warning-500/40" : "border-brand-500/30"}`}>
                  <span className="flex items-center gap-2">
                    {isPlaceholder ? <ClockCircleOutlined className="text-warning-500" /> : <TeamOutlined className="text-brand-500" />}
                    <span className={isPlaceholder ? "text-gray-500" : "font-semibold text-gray-800 dark:text-white/90"}>
                      {team.teamName || team.placeholderName || "TBD"}
                    </span>
                    {isPlaceholder && <Badge variant="warning">Placeholder</Badge>}
                  </span>
                  {!isPlaceholder && teamId && (
                    <button
                      type="button"
                      disabled={isRemovingTeam}
                      onClick={() => setConfirmRemoveGroupTeam({ teamId, teamName: team.teamName })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-error-500 hover:bg-error-50 disabled:opacity-50 dark:hover:bg-error-500/10"
                      title="Remove team from group"
                    >
                      <DeleteOutlined />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {standings.length > 0 && (
          <>
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
            <div>
              <h5 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Standings</h5>
              <MiniStandingsTable rows={standings} />
            </div>
          </>
        )}

        {groupOngoingMatches.length > 0 && (
          <>
            <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Live Matches ({groupOngoingMatches.length})</div>
            <LiveMatchList matches={groupOngoingMatches} currentTime={currentTime} onNavigate={(id) => navigate(`/fixtures/${id}`)} />
          </>
        )}

        <Modal
          isOpen={confirmRemoveGroupTeam !== null}
          onClose={() => setConfirmRemoveGroupTeam(null)}
          title="Remove Team"
          className="max-w-[420px]"
          footer={
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRemoveGroupTeam(null)}>Cancel</Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirmRemoveGroupTeam) handleRemoveTeamFromGroup(selectedNode.id, confirmRemoveGroupTeam.teamId, confirmRemoveGroupTeam.teamName);
                  setConfirmRemoveGroupTeam(null);
                }}
              >
                Remove
              </Button>
            </>
          }
        >
          <p className="text-theme-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to remove "{confirmRemoveGroupTeam?.teamName || 'this team'}" from {group.groupName}?
          </p>
        </Modal>
      </div>
    );
  };

  const renderEmptyState = !matchDayStructure || matchDayStructure.rounds.length === 0;

  return (
    <div className="relative" style={{ height: "calc(100vh - 200px)" }}>
      {renderEmptyState ? (
        <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-center">
            <p className="mb-4 text-theme-sm text-gray-400 dark:text-gray-500">No MatchDay structure yet.</p>
            <Button type="button" startIcon={<PlusOutlined />} onClick={() => handleCreateRound()}>
              Add First Round
            </Button>
          </div>
        </div>
      ) : (
        <>
          <MatchDayFlowVisualization
            matchDayStructure={matchDayStructure}
            fixtures={finalFixtures}
            onNodeClick={handleNodeClick}
            onCreateRound={handleCreateRound}
            onCreateGroup={handleCreateGroup}
            onAssignTeams={handleAssignTeams}
            onGenerateMatches={handleGenerateRoundMatches}
            onRefresh={onRefresh}
          />

          {/* Details drawer (right-side panel) */}
          {showDetailsDrawer && selectedNode !== null && (
            <div className="fixed inset-0 z-modal flex justify-end">
              <div
                className="fixed inset-0 bg-gray-400/50 backdrop-blur-[2px] dark:bg-gray-900/50"
                onClick={() => {
                  dispatch(setShowDetailsDrawer(false));
                  dispatch(setSelectedNode(null));
                }}
              />
              <div className="no-scrollbar relative flex h-full w-full max-w-[420px] flex-col overflow-y-auto bg-white p-5 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-base font-bold text-gray-800 dark:text-white/90">
                    {selectedNode?.type === "round" ? <><TrophyOutlined /> Round Details</> : <><TeamOutlined /> Group Details</>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setShowDetailsDrawer(false));
                      dispatch(setSelectedNode(null));
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    ×
                  </button>
                </div>
                {selectedNode?.type === "round" ? renderRoundDetails() : renderGroupDetails()}
              </div>
            </div>
          )}
        </>
      )}

      <RoundManagement
        matchDayId={matchDayId}
        roundId={selectedNode?.type === "round" ? selectedNode.id : null}
        createContext={roundCreateContext}
        isModalVisible={showRoundModal}
        onClose={() => {
          dispatch(setShowRoundModal(false));
          setRoundCreateContext(null);
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowRoundModal(false));
          setRoundCreateContext(null);
          dispatch(setSelectedNode(null));
        }}
        existingRounds={matchDayStructure?.rounds || []}
      />

      <GroupManagement
        roundId={selectedNode?.type === "round" ? selectedNode.id : (selectedNode?.data?.roundId || null)}
        groupId={selectedNode?.type === "group" ? selectedNode.id : null}
        isModalVisible={showGroupModal}
        onClose={() => {
          dispatch(setShowGroupModal(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowGroupModal(false));
          dispatch(setSelectedNode(null));
        }}
      />

      <TeamAssignment
        groupId={teamAssignmentContext.groupId}
        roundId={teamAssignmentContext.roundId}
        roundType={teamAssignmentContext.roundType}
        teams={teams}
        matchDayStructure={matchDayStructure}
        isModalVisible={showTeamAssignment}
        onClose={() => {
          dispatch(setShowTeamAssignment(false));
          setTeamAssignmentContext({ groupId: null, roundId: null, roundType: undefined });
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowTeamAssignment(false));
          setTeamAssignmentContext({ groupId: null, roundId: null, roundType: undefined });
          dispatch(setSelectedNode(null));
        }}
      />

      <GroupMatchGenerationModal
        matchDayId={matchDayId}
        groupId={selectedNode?.type === "group" ? selectedNode.id : null}
        groupName={selectedNode?.type === "group" ? selectedNode.data?.groupName : null}
        teamCount={selectedNode?.type === "group" ? selectedNode.data?.teamCount || 0 : 0}
        groupFormat={
          selectedNode?.type === "group"
            ? matchDayStructure?.rounds
                .find((r) => r.groups?.some((g) => g.id === selectedNode.id))
                ?.groups?.find((g) => g.id === selectedNode.id)?.groupFormat
            : undefined
        }
        isModalVisible={showMatchGeneration}
        onClose={() => {
          dispatch(setShowMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
      />

      <RoundMatchGenerationModal
        roundId={selectedNode?.type === "round" ? selectedNode.id : null}
        roundName={selectedNode?.type === "round" ? selectedNode.data?.roundName : null}
        teamCount={
          selectedNode?.type === "round"
            ? selectedNode.data?.teams?.filter((t: any) => !t.isPlaceholder).length || 0
            : 0
        }
        isModalVisible={showRoundMatchGeneration}
        onClose={() => {
          dispatch(setShowRoundMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowRoundMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
        venues={venues}
        matchDayVenueId={matchDayVenueId}
        matchDayStartDate={matchDaySummary?.content?.[0]?.matchDayDate || null}
      />

      <Modal
        isOpen={confirmRemoveTeam !== null}
        onClose={() => setConfirmRemoveTeam(null)}
        title="Remove Team?"
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRemoveTeam(null)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" onClick={confirmRemoveTeamFromRound}>Remove</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to remove "{confirmRemoveTeam?.teamName || 'Team'}" from this round?
        </p>
      </Modal>
    </div>
  );
}
