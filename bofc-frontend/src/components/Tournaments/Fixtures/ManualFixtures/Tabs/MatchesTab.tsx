import React, { useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { ReloadOutlined, TrophyOutlined, TeamOutlined, CalendarOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../../state/store";
import { TournamentStructureResponse, RoundGroupResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetFixturesQuery } from "../../../../../state/features/fixtures/fixturesSlice";
import { setEditingFixture, setIsEditModalVisible } from "../../../../../state/features/manualFixtures/manualFixturesUISlice";
import FixturesTable from "../../FixturesTable";
import EditFixtureModal from "../../EditFixtureModal";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";
import Button from "../../../../ui/button";
import Badge from "../../../../ui/badge";

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

// Helper function to extract all unique teams from tournament structure
function extractTeamsFromStructure(tournamentStructure?: TournamentStructureResponse): Array<{ teamId: number; teamName: string }> {
  if (!tournamentStructure) return [];

  const teamsMap = new Map<number, { teamId: number; teamName: string }>();

  tournamentStructure.rounds?.forEach((round) => {
    round.teams?.forEach((team) => {
      const teamId = team.teamId ?? team.id;
      if (teamId && team.teamName) {
        teamsMap.set(teamId, { teamId, teamName: team.teamName });
      }
    });

    round.groups?.forEach((group) => {
      group.teams?.forEach((team) => {
        const teamId = team.teamId ?? team.id;
        if (teamId && team.teamName) {
          teamsMap.set(teamId, { teamId, teamName: team.teamName });
        }
      });
    });
  });

  return Array.from(teamsMap.values());
}

interface MatchesTabProps {
  tournamentId: number;
  tournamentStructure?: TournamentStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
  isActive?: boolean;
}

export default function MatchesTab({
  tournamentId,
  tournamentStructure,
  isLoading,
  onRefresh,
  isActive = false,
}: MatchesTabProps) {
  const dispatch = useDispatch();
  const { editingFixture, isEditModalVisible } = useSelector((state: RootState) => state.manualFixturesUI);

  const {
    data: fixturesData,
    isLoading: fixturesLoading,
    refetch: refetchFixtures,
  } = useGetFixturesQuery(
    { tournamentId },
    { skip: !isActive }
  );

  const fixtures = fixturesData?.content || [];

  useEffect(() => {
    if (isActive) {
      refetchFixtures();
    }
  }, [isActive, refetchFixtures]);

  const finalFixtures = fixtures;

  const fixturesByRoundAndGroup = useMemo(() => {
    const grouped: Record<number, Record<string, IFixture[]>> = {};
    const unmatchedFixtures: IFixture[] = [];

    finalFixtures.forEach((fixture) => {
      let roundId: number | null = null;
      let matchedRound = null;

      if (!tournamentStructure) {
        unmatchedFixtures.push(fixture);
        return;
      }

      const matchesTournament = fixture.tournamentId === tournamentStructure.tournamentId;
      if (!matchesTournament) {
        unmatchedFixtures.push(fixture);
        return;
      }

      const fixtureRoundNumber = fixture.roundNumber ?? fixture.round;
      if (fixtureRoundNumber) {
        matchedRound = tournamentStructure.rounds.find(
          (r) => r.roundNumber === fixtureRoundNumber
        );
        if (matchedRound) {
          roundId = matchedRound.id;
        }
      }

      if (!roundId && fixture.groupName) {
        for (const round of tournamentStructure.rounds) {
          if (round.groups?.some((g) => g.groupName === fixture.groupName)) {
            matchedRound = round;
            roundId = round.id;
            break;
          }
        }
      }

      if (!roundId && fixture.round) {
        matchedRound = tournamentStructure.rounds.find(
          (r) => r.id === fixture.round
        );
        if (matchedRound) {
          roundId = matchedRound.id;
        }
      }

      if (!roundId) {
        unmatchedFixtures.push(fixture);
        return;
      }

      const groupName = matchedRound?.roundType === "GROUP_BASED"
        ? (fixture.groupName || "No Group")
        : "No Group";

      if (!grouped[roundId]) {
        grouped[roundId] = {};
      }

      if (!grouped[roundId][groupName]) {
        grouped[roundId][groupName] = [];
      }

      grouped[roundId][groupName].push(fixture);
    });

    Object.keys(grouped).forEach((roundId) => {
      Object.keys(grouped[Number(roundId)]).forEach((groupName) => {
        grouped[Number(roundId)][groupName] = [...grouped[Number(roundId)][groupName]].sort((a, b) => a.matchOrder - b.matchOrder);
      });
    });

    if (unmatchedFixtures.length > 0) {
      grouped[-1] = { "Unmatched": unmatchedFixtures };
    }

    return grouped;
  }, [finalFixtures, tournamentStructure]);

  const handleRefresh = () => {
    refetchFixtures();
    onRefresh();
    toast.success("Matches refreshed");
  };

  const handleEditFixture = (fixture: IFixture) => {
    dispatch(setEditingFixture(fixture));
  };

  if (!tournamentStructure || tournamentStructure.rounds.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">No matches available yet.</p>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Create rounds and generate matches in the Tournament tab.</p>
      </div>
    );
  }

  if (finalFixtures.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <CalendarOutlined className="mb-2 block text-3xl text-gray-300 dark:text-gray-600" />
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">No matches found.</p>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Generate matches in the Tournament tab.</p>
      </div>
    );
  }

  const sortedRounds = [...tournamentStructure.rounds].sort((a, b) =>
    (a.sequenceOrder || 0) - (b.sequenceOrder || 0)
  );

  const hasMatchedFixtures = sortedRounds.some((round) => {
    const roundFixtures = fixturesByRoundAndGroup[round.id] || {};
    return Object.keys(roundFixtures).length > 0;
  });

  const shouldShowAllFixtures = finalFixtures.length > 0 && !hasMatchedFixtures && !fixturesByRoundAndGroup[-1];

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex justify-end">
        <Button type="button" size="sm" startIcon={<ReloadOutlined />} disabled={fixturesLoading || isLoading} onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {shouldShowAllFixtures && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrophyOutlined className="text-brand-500" />
            <h5 className="text-lg font-bold text-gray-800 dark:text-white/90">All Matches</h5>
            <span className="text-theme-xs text-gray-400">({fixtures.length} matches)</span>
          </div>
          <div className="overflow-x-auto">
            <FixturesTable
              fixtures={[...finalFixtures].sort((a, b) => a.matchOrder - b.matchOrder)}
              isLoading={fixturesLoading || isLoading}
              onEditFixture={handleEditFixture}
              tournamentId={tournamentId}
              teams={extractTeamsFromStructure(tournamentStructure)}
              onRefresh={() => {
                refetchFixtures();
                onRefresh();
              }}
              enableAddRemove={true}
              enableDragDrop={true}
            />
          </div>
        </div>
      )}

      {!shouldShowAllFixtures && (
        <div className="flex flex-col gap-6">
          {fixturesByRoundAndGroup[-1] && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrophyOutlined className="text-brand-500" />
                <h5 className="text-lg font-bold text-gray-800 dark:text-white/90">Unmatched Matches</h5>
                <span className="text-theme-xs text-gray-400">({fixturesByRoundAndGroup[-1]["Unmatched"]?.length || 0} matches)</span>
              </div>
              <div className="overflow-x-auto">
                <FixturesTable
                  fixtures={fixturesByRoundAndGroup[-1]["Unmatched"] || []}
                  isLoading={fixturesLoading || isLoading}
                  onEditFixture={handleEditFixture}
                  tournamentId={tournamentId}
                  teams={extractTeamsFromStructure(tournamentStructure)}
                  onRefresh={() => {
                    refetchFixtures();
                    onRefresh();
                  }}
                  enableAddRemove={true}
                  enableDragDrop={true}
                />
              </div>
            </div>
          )}

          {sortedRounds.map((round) => {
            const roundFixtures = fixturesByRoundAndGroup[round.id] || {};
            const hasMatches = Object.keys(roundFixtures).length > 0;

            if (!hasMatches) return null;

            return (
              <div key={round.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <TrophyOutlined className="text-brand-500" />
                    <h5 className="text-base font-bold text-gray-800 dark:text-white/90">{round.roundName}</h5>
                    <span className="text-theme-xs text-gray-400">
                      Round {round.roundNumber} • {round.roundType.replace("_", " ")} • {round.totalMatches} {round.totalMatches === 1 ? 'match' : 'matches'}
                    </span>
                  </span>
                  <Badge variant={round.status === "COMPLETED" ? "success" : round.status === "ONGOING" ? "primary" : "light"}>{round.status}</Badge>
                </div>

                <div className="flex flex-col gap-4">
                  {round.roundType === "GROUP_BASED" && round.groups ? (
                    flattenGroups(round.groups).map((group) => {
                      const groupMatches = roundFixtures[group.groupName || ""] || [];
                      if (groupMatches.length === 0) return null;

                      return (
                        <div key={group.id}>
                          <div className="mb-2 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                            <TeamOutlined className="text-gray-400" />
                            <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{group.groupName}</span>
                            <span className="text-theme-xs text-gray-400">({groupMatches.length} {groupMatches.length === 1 ? 'match' : 'matches'})</span>
                          </div>
                          <div className="overflow-x-auto">
                            <FixturesTable
                              fixtures={groupMatches}
                              isLoading={fixturesLoading || isLoading}
                              onEditFixture={handleEditFixture}
                              tournamentId={tournamentId}
                              roundId={round.id}
                              groupId={group.id}
                              groupName={group.groupName}
                              teams={extractTeamsFromStructure(tournamentStructure)}
                              onRefresh={() => {
                                refetchFixtures();
                                onRefresh();
                              }}
                              enableAddRemove={true}
                              enableDragDrop={true}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    (() => {
                      const allRoundMatches: IFixture[] = [];
                      Object.values(roundFixtures).forEach((groupMatches) => {
                        allRoundMatches.push(...groupMatches);
                      });
                      const sortedMatches = [...allRoundMatches].sort((a, b) => a.matchOrder - b.matchOrder);

                      if (sortedMatches.length === 0) return null;

                      return (
                        <div className="overflow-x-auto">
                          <FixturesTable
                            fixtures={sortedMatches}
                            isLoading={fixturesLoading || isLoading}
                            onEditFixture={handleEditFixture}
                            tournamentId={tournamentId}
                            roundId={round.id}
                            teams={extractTeamsFromStructure(tournamentStructure)}
                            onRefresh={() => {
                              refetchFixtures();
                              onRefresh();
                            }}
                            enableAddRemove={true}
                            enableDragDrop={true}
                          />
                        </div>
                      );
                    })()
                  )}

                  {round.roundType === "GROUP_BASED" && Object.keys(roundFixtures).map((groupName) => {
                    if (groupName === "No Group" || groupName === "null") {
                      const noGroupMatches = roundFixtures[groupName] || [];
                      if (noGroupMatches.length === 0) return null;

                      return (
                        <div key={`no-group-${round.id}`}>
                          <div className="mb-2 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                            <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Other Matches</span>
                            <span className="text-theme-xs text-gray-400">({noGroupMatches.length} matches)</span>
                          </div>
                          <div className="overflow-x-auto">
                            <FixturesTable
                              fixtures={noGroupMatches}
                              isLoading={fixturesLoading || isLoading}
                              onEditFixture={handleEditFixture}
                              tournamentId={tournamentId}
                              roundId={round.id}
                              teams={extractTeamsFromStructure(tournamentStructure)}
                              onRefresh={() => {
                                refetchFixtures();
                                onRefresh();
                              }}
                              enableAddRemove={true}
                              enableDragDrop={true}
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingFixture && (
        <EditFixtureModal
          fixture={editingFixture}
          isModalVisible={isEditModalVisible}
          handleSetIsModalVisible={(visible: boolean) => dispatch(setIsEditModalVisible(visible))}
          onSuccess={() => {
            refetchFixtures();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
