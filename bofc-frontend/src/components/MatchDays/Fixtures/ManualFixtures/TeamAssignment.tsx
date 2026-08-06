import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { UserAddOutlined, TeamOutlined } from "@ant-design/icons";
import {
  useAssignTeamsToGroupMutation,
  useAssignTeamsToRoundMutation,
  useRemoveTeamFromGroupMutation,
  useRemoveTeamFromRoundMutation,
  useGetGroupByIdQuery,
  useGetRoundByIdQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { MatchDayStructureResponse, RoundGroupResponse, MatchDayRoundResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetFixturesQuery } from "../../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";
import Modal from "../../../ui/modal";
import Button from "../../../ui/button";
import Badge from "../../../ui/badge";
import AlertBox from "../../../ui/alert";

// Recursively flatten a group tree (including nested childGroups) into a flat list
function flattenGroups(groups: RoundGroupResponse[] = []): RoundGroupResponse[] {
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
}

// Leaf groups are the ones that actually hold teams/matches/standings -
// parent groups are just containers for nested sub-groups
function getLeafGroups(groups: RoundGroupResponse[] = []): RoundGroupResponse[] {
  return flattenGroups(groups).filter(
    (group) => !group.childGroups || group.childGroups.length === 0
  );
}

// First word of a group/round name, used to match lanes like "CUP"/"PLATE"
function getLaneKeyword(name?: string | null): string {
  return (name || "").trim().split(/\s+/)[0]?.toUpperCase() || "";
}

// Resolve the leaf groups of the previous round that feed the current round.
// For branched knockouts (e.g. "CUP FINAL" fed by "CUP SEMIFINAL" -> "Cup Semifinal 1/2"
// and "PLATE FINAL" fed by "PLATE SEMIFINAL" -> "Plate Semifinal 1/2"), this scopes
// the result to the matching lane based on the leading word of the group/round name.
function getSourceLeafGroups(
  previousRound: MatchDayRoundResponse | null | undefined,
  currentRound: MatchDayRoundResponse | null | undefined
): RoundGroupResponse[] {
  if (!previousRound?.groups) return [];

  const allLeafGroups = getLeafGroups(previousRound.groups);

  const laneKeyword = getLaneKeyword(currentRound?.roundName);
  if (!laneKeyword) return allLeafGroups;

  const matchingTopGroups = previousRound.groups.filter(
    (group) => getLaneKeyword(group.groupName) === laneKeyword
  );

  if (matchingTopGroups.length === 0) return allLeafGroups;

  const laneLeafGroups = getLeafGroups(matchingTopGroups);
  return laneLeafGroups.length > 0 ? laneLeafGroups : allLeafGroups;
}

interface TeamAssignmentProps {
  groupId: number | null;
  roundId: number | null;
  roundType?: "GROUP_BASED" | "DIRECT_KNOCKOUT";
  teams: Array<{ teamId: number; teamName: string }>;
  matchDayStructure?: MatchDayStructureResponse;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const miniStandingsHeaders = ["Pos", "Team", "P", "W", "D", "L", "GD", "Pts"];

function MiniStandingsTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-theme-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {miniStandingsHeaders.map((h) => (
              <th key={h} className={`px-2 py-1.5 font-semibold text-gray-500 dark:text-gray-400 ${h === "Team" || h === "Pos" ? "text-left" : "text-center"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((standing) => (
            <tr key={standing.teamId} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-2 py-1.5"><Badge variant={standing.position === 1 ? "warning" : "light"}>{standing.position}</Badge></td>
              <td className={`px-2 py-1.5 ${standing.position <= 2 ? "font-semibold text-gray-800 dark:text-white/90" : "text-gray-600 dark:text-gray-300"}`}>{standing.teamName}</td>
              <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400">{standing.matchesPlayed}</td>
              <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400">{standing.wins}</td>
              <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400">{standing.draws}</td>
              <td className="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400">{standing.losses}</td>
              <td className={`px-2 py-1.5 text-center ${standing.goalDifference > 0 ? "text-success-600" : standing.goalDifference < 0 ? "text-error-600" : "text-gray-500"}`}>
                {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
              </td>
              <td className="px-2 py-1.5 text-center font-semibold text-gray-800 dark:text-white/90">{standing.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TeamAssignment({
  groupId,
  roundId,
  roundType,
  teams,
  matchDayStructure,
  isModalVisible,
  onClose,
  onSuccess,
}: TeamAssignmentProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  const [assignTeamsToGroup, { isLoading: isAssigningToGroup }] = useAssignTeamsToGroupMutation();
  const [assignTeamsToRound, { isLoading: isAssigningToRound }] = useAssignTeamsToRoundMutation();
  const [removeTeam] = useRemoveTeamFromGroupMutation();
  const [removeTeamFromRound] = useRemoveTeamFromRoundMutation();

  const { data: groupData } = useGetGroupByIdQuery({ groupId: groupId! }, { skip: !groupId });
  const { data: roundData } = useGetRoundByIdQuery({ roundId: roundId! }, { skip: !roundId });

  const group = groupData?.content;
  const round = roundData?.content;

  const isDirectKnockout = roundType === "DIRECT_KNOCKOUT" || round?.roundType === "DIRECT_KNOCKOUT";

  // Find the previous round that actually feeds this round.
  // Simply taking "sequenceOrder - 1" breaks for branched knockouts: e.g. if
  // CUP FINAL is sequence 3 and PLATE FINAL is sequence 4, PLATE FINAL's
  // "sequenceOrder - 1" would resolve to CUP FINAL instead of the Semifinal
  // Stage's PLATE lane. Walk backwards and pick the nearest round whose
  // lane (CUP/PLATE/etc.) matches the current round.
  const previousRound = (() => {
    if (!round || !round.sequenceOrder || round.sequenceOrder <= 1) return null;

    const laneKeyword = getLaneKeyword(round.roundName);
    const candidates = (matchDayStructure?.rounds || [])
      .filter((r) => r.sequenceOrder < round.sequenceOrder!)
      .sort((a, b) => b.sequenceOrder - a.sequenceOrder);

    for (const candidate of candidates) {
      if (candidate.roundType === "GROUP_BASED") {
        if (getSourceLeafGroups(candidate, round).length > 0) return candidate;
      } else if (!laneKeyword || getLaneKeyword(candidate.roundName) === laneKeyword) {
        return candidate;
      }
    }

    return candidates[0] || null;
  })();

  const matchDayId = round?.matchDayId || matchDayStructure?.matchDayId;

  const { data: fixturesData } = useGetFixturesQuery(
    { matchDayId: matchDayId! },
    { skip: !matchDayId || !previousRound || previousRound.roundType !== "DIRECT_KNOCKOUT" }
  );
  const fixtures = fixturesData?.content || [];

  const previousRoundGroups = getSourceLeafGroups(previousRound, round);

  const assignedTeamIds = isDirectKnockout
    ? (round?.teams?.filter((t) => {
        const identifier = t.teamId ?? t.id;
        return identifier !== null && identifier !== undefined;
      }).map((t) => t.teamId ?? t.id) || [])
    : (group?.teams?.filter((t) => {
        const identifier = t.teamId ?? t.id;
        return identifier !== null && identifier !== undefined;
      }).map((t) => t.teamId ?? t.id) || []);

  const isAssigning = isAssigningToGroup || isAssigningToRound;

  const teamAssignmentMap = new Map<number, {
    groupName: string;
    roundName: string;
    groupId: number;
    roundId: number;
    isSameRound?: boolean;
  }>();

  const currentRound = matchDayStructure?.rounds.find((r) => {
    if (isDirectKnockout) {
      return r.id === roundId;
    } else {
      return r.groups?.some((g) => g.id === groupId);
    }
  });

  matchDayStructure?.rounds.forEach((round) => {
    const isSameRound = currentRound && round.id === currentRound.id;
    if (!isSameRound) return;

    if (round.groups) {
      round.groups.forEach((grp) => {
        if (grp.teams) {
          grp.teams.forEach((team: any) => {
            const teamIdentifier = team.teamId ?? team.id;
            if (teamIdentifier && !team.isPlaceholder) {
              const isCurrentGroup = !isDirectKnockout && groupId === grp.id;
              const isCurrentRound = isDirectKnockout && roundId === round.id;
              const isSameRoundDifferentGroup = !isDirectKnockout &&
                currentRound &&
                round.id === currentRound.id &&
                grp.id !== groupId;

              if (!isCurrentGroup && !isCurrentRound && isSameRoundDifferentGroup) {
                teamAssignmentMap.set(teamIdentifier, {
                  groupName: grp.groupName,
                  roundName: round.roundName,
                  groupId: grp.id,
                  roundId: round.id,
                  isSameRound: true,
                });
              }
            }
          });
        }
      });
    }
  });

  const teamPerformanceMap = new Map<number, {
    groupName?: string;
    position?: number;
    points?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    goalDifference?: number;
    matchesPlayed?: number;
  }>();

  previousRoundGroups.forEach((group) => {
    if (group.standings) {
      group.standings.forEach((standing) => {
        if (standing.teamId) {
          teamPerformanceMap.set(standing.teamId, {
            groupName: group.groupName,
            position: standing.position ?? undefined,
            points: standing.points ?? undefined,
            wins: standing.wins ?? undefined,
            draws: standing.draws ?? undefined,
            losses: standing.losses ?? undefined,
            goalDifference: standing.goalDifference ?? undefined,
            matchesPlayed: standing.matchesPlayed ?? undefined,
          });
        }
      });
    }
  });

  useEffect(() => {
    if (isModalVisible) {
      setSelectedTeamIds([]);
    }
  }, [isModalVisible]);

  const availableTeamsForAssignment = useMemo(() => {
    if (!round || !round.sequenceOrder || round.sequenceOrder === 1) {
      return teams;
    }

    if (!previousRound) {
      console.warn(`No previous round found for round ${round.roundName} (sequence ${round.sequenceOrder})`);
      return [];
    }

    const previousRoundTeams: Array<{ teamId: number; teamName: string }> = [];

    if (previousRound.roundType === "GROUP_BASED" && previousRound.groups) {
      const sourceGroups = getSourceLeafGroups(previousRound, round);
      sourceGroups.forEach((group) => {
        if (group.standings && group.standings.length > 0) {
          group.standings.forEach((standing) => {
            if (standing.teamId && !previousRoundTeams.find(t => t.teamId === standing.teamId)) {
              previousRoundTeams.push({
                teamId: standing.teamId,
                teamName: standing.teamName,
              });
            }
          });
        } else if (group.teams) {
          group.teams.forEach((team) => {
            const teamIdentifier = team.teamId ?? team.id;
            if (teamIdentifier && !team.isPlaceholder) {
              if (!previousRoundTeams.find(t => t.teamId === teamIdentifier)) {
                previousRoundTeams.push({
                  teamId: teamIdentifier,
                  teamName: team.teamName || "",
                });
              }
            }
          });
        }
      });
    } else if (previousRound.roundType === "DIRECT_KNOCKOUT") {
      if (previousRound.teams) {
        previousRound.teams.forEach((team) => {
          const teamIdentifier = team.teamId ?? team.id;
          if (teamIdentifier && !team.isPlaceholder) {
            if (!previousRoundTeams.find(t => t.teamId === teamIdentifier)) {
              previousRoundTeams.push({
                teamId: teamIdentifier,
                teamName: team.teamName || "",
              });
            }
          }
        });
      }
    }

    return previousRoundTeams;
  }, [round, previousRound, teams]);

  const previousRoundStandings = useMemo(() => {
    if (!previousRound || previousRound.roundType !== "DIRECT_KNOCKOUT" || !previousRound.teams) {
      return [];
    }

    const roundMatches = fixtures.filter((f: IFixture) => {
      const matchesMatchDay = f.matchDayId === matchDayId;
      if (!matchesMatchDay) return false;
      const fixtureRoundNumber = f.roundNumber ?? f.round;
      const matchesByRoundNumber = fixtureRoundNumber === previousRound.roundNumber;
      const matchesByRoundId = f.round === previousRound.id;
      return matchesByRoundNumber || matchesByRoundId;
    });

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

    previousRound.teams.forEach((team: any) => {
      const identifier = team.teamId ?? team.id;
      if (identifier && !team.isPlaceholder) {
        teamStats[identifier] = {
          teamId: identifier,
          teamName: team.teamName || `Team ${identifier}`,
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

    roundMatches.forEach((match: IFixture) => {
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
    });

    return Object.values(teamStats)
      .filter((stat) => stat.matchesPlayed > 0 || previousRound.teams?.some((t: any) => (t.teamId ?? t.id) === stat.teamId))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .map((stat, index) => ({
        ...stat,
        position: index + 1,
      }));
  }, [previousRound, fixtures, matchDayId]);

  const allTeams = availableTeamsForAssignment;

  const handleTeamToggle = (teamId: number, checked: boolean) => {
    const assignment = teamAssignmentMap.get(teamId);
    if (assignment && assignment.isSameRound) {
      toast.warning(`Team is already assigned to ${assignment.groupName} in the same round. Remove it from that group first.`);
      return;
    }

    if (assignedTeamIds.includes(teamId)) {
      toast.warning("Team is already assigned to this group/round");
      return;
    }

    if (checked) {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    } else {
      setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    }
  };

  const handleAssignTeams = async () => {
    if (isDirectKnockout) {
      if (!roundId) {
        toast.error("No round selected");
        return;
      }
    } else {
      if (!groupId) {
        toast.error("No group selected");
        return;
      }
    }

    if (selectedTeamIds.length === 0) {
      toast.warning("Please select at least one team");
      return;
    }

    try {
      if (isDirectKnockout) {
        await assignTeamsToRound({ roundId: roundId!, teamIds: selectedTeamIds }).unwrap();
      } else {
        await assignTeamsToGroup({ groupId: groupId!, teamIds: selectedTeamIds }).unwrap();
      }

      toast.success(`${selectedTeamIds.length} team(s) assigned successfully`);
      setSelectedTeamIds([]);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to assign teams:", error);
    }
  };

  const handleCancel = () => {
    setSelectedTeamIds([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isModalVisible}
      onClose={handleCancel}
      title={
        <span className="flex items-center gap-2">
          <UserAddOutlined className="text-brand-500" />
          Assign Teams to {isDirectKnockout ? (round?.roundName || "Round") : (group?.groupName || "Group")}
        </span>
      }
      className="max-w-[800px]"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Close</Button>
          <Button type="button" size="sm" startIcon={<UserAddOutlined />} disabled={isAssigning || selectedTeamIds.length === 0} onClick={handleAssignTeams}>
            Assign {selectedTeamIds.length > 0 ? `${selectedTeamIds.length} ` : ""}Team(s)
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {(group || round) && (
          <AlertBox variant="info" title="Team Assignment">
            <div className="flex flex-col gap-1">
              {isDirectKnockout ? (
                <>
                  <span>Round: <strong>{round?.roundName}</strong></span>
                  <span>Type: <strong>Direct Knockout</strong></span>
                  <span>Current Teams: <strong>{assignedTeamIds.length}</strong></span>
                  {previousRound && (
                    <span className="mt-1 text-theme-xs text-gray-400">Teams from: {previousRound.roundName} (Sequence {previousRound.sequenceOrder})</span>
                  )}
                </>
              ) : (
                <>
                  <span>Group: <strong>{group?.groupName}</strong></span>
                  {group?.maxTeams && <span>Current: <strong>{assignedTeamIds.length}</strong> / <strong>{group.maxTeams}</strong> (max)</span>}
                </>
              )}
            </div>
          </AlertBox>
        )}

        {previousRound && previousRound.roundType === "GROUP_BASED" && previousRoundGroups.length > 0 && (
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <div className="mb-2 flex items-center gap-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              Previous Round: {previousRound.roundName}
              <Badge variant="info">{previousRoundGroups.length} Group{previousRoundGroups.length !== 1 ? 's' : ''}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {previousRoundGroups.map((group) => (
                <div key={group.id} className="rounded-lg border border-gray-100 p-2.5 dark:border-gray-800">
                  <div className="mb-1.5 text-theme-xs font-semibold text-gray-700 dark:text-gray-300">{group.groupName}</div>
                  {group.standings && group.standings.length > 0 ? (
                    <MiniStandingsTable rows={group.standings} />
                  ) : (
                    <p className="text-theme-xs text-gray-400">No standings available</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {previousRound && previousRound.roundType === "DIRECT_KNOCKOUT" && previousRoundStandings.length > 0 && (
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <div className="mb-2 flex items-center gap-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              Previous Round: {previousRound.roundName}
              <Badge variant="info">Direct Knockout</Badge>
              <Badge variant="success">{previousRoundStandings.length} Team{previousRoundStandings.length !== 1 ? 's' : ''}</Badge>
            </div>
            <MiniStandingsTable rows={previousRoundStandings} />
          </div>
        )}

        {assignedTeamIds.length > 0 && (
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <div className="mb-2 flex items-center gap-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              <TeamOutlined /> Currently Assigned Teams <Badge variant="info">{assignedTeamIds.length}</Badge>
              <span className="text-theme-xs font-normal text-gray-400">(Remove teams from Group Details)</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {(isDirectKnockout ? round?.teams : group?.teams)
                ?.filter((t) => {
                  const identifier = t.teamId ?? t.id;
                  return identifier !== null && identifier !== undefined;
                })
                .map((team) => (
                  <div key={team.id} className="flex items-center gap-2 rounded-lg border border-brand-500/40 px-3 py-2">
                    <TeamOutlined className="text-brand-500" />
                    <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{team.teamName}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
            {round && round.sequenceOrder && round.sequenceOrder > 1
              ? `Teams from ${previousRound?.roundName || "Previous Round"}`
              : "All Teams"}
            <Badge variant="success">{allTeams.filter(t => !teamAssignmentMap.has(t.teamId) && !assignedTeamIds.includes(t.teamId)).length} available</Badge>
            {teamAssignmentMap.size > 0 && <Badge variant="warning">{teamAssignmentMap.size} already assigned</Badge>}
            {selectedTeamIds.length > 0 && <Badge variant="info">{selectedTeamIds.length} selected</Badge>}
          </div>

          {allTeams.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {allTeams.map((team) => {
                const performance = teamPerformanceMap.get(team.teamId);
                const assignment = teamAssignmentMap.get(team.teamId);
                const isAlreadyAssigned = assignedTeamIds.includes(team.teamId);
                const isAssignedToOtherGroupInSameRound = assignment !== undefined && assignment.isSameRound === true;
                const isDisabled = isAlreadyAssigned || isAssignedToOtherGroupInSameRound;
                const isSelected = selectedTeamIds.includes(team.teamId);

                return (
                  <label
                    key={team.teamId}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
                      isSelected ? "border-brand-500" : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={(e) => handleTeamToggle(team.teamId, e.target.checked)}
                      className="mt-1 h-4 w-4 accent-brand-500"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TeamOutlined className={isDisabled ? "text-gray-400" : "text-brand-500"} />
                        <span className={`text-theme-sm ${performance?.position !== undefined && performance.position <= 2 ? "font-semibold" : ""} ${isDisabled ? "text-gray-400" : "text-gray-800 dark:text-white/90"}`}>
                          {team.teamName}
                        </span>
                        {isAssignedToOtherGroupInSameRound && assignment && <Badge variant="error" className="!text-[10px]">⚠ {assignment.groupName}</Badge>}
                        {isAlreadyAssigned && <Badge variant="info" className="!text-[10px]">Current</Badge>}
                      </div>
                      {isAssignedToOtherGroupInSameRound && assignment && (
                        <span className="text-[10px] italic text-gray-400">Already in {assignment.groupName} (same round)</span>
                      )}
                      {performance && !isAssignedToOtherGroupInSameRound && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {performance.groupName && <Badge variant="info" className="!text-[10px]">{performance.groupName}</Badge>}
                          {performance.position && <Badge variant={performance.position === 1 ? "warning" : "light"} className="!text-[10px]">Pos: {performance.position}</Badge>}
                          {performance.points !== undefined && <span className="text-gray-400">{performance.points} pts</span>}
                          {performance.goalDifference !== undefined && (
                            <span className={performance.goalDifference > 0 ? "text-success-600" : performance.goalDifference < 0 ? "text-error-600" : "text-gray-400"}>
                              GD: {performance.goalDifference > 0 ? `+${performance.goalDifference}` : performance.goalDifference}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-theme-sm text-gray-400 dark:text-gray-500">No teams available</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
