import React, { useState, useMemo } from "react";
import {
  Modal,
  Space,
  Button,
  Typography,
  Tag,
  Alert,
  message,
  Empty,
  Row,
  Col,
  Card,
  Divider,
  theme,
} from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { TournamentRoundResponse, RoundGroupResponse, GroupStandingResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";

const { Title, Text } = Typography;

interface TeamAdvancementModalProps {
  round: TournamentRoundResponse | null;
  nextRound: TournamentRoundResponse | null;
  allFixtures?: IFixture[];
  isModalVisible: boolean;
  onClose: () => void;
  onConfirm: (selectedTeamIds: number[]) => void;
  isLoading?: boolean;
}

interface TeamSlot {
  teamId: number | null;
  teamName: string | null;
  seedPosition?: number;
}

export default function TeamAdvancementModal({
  round,
  nextRound,
  allFixtures = [],
  isModalVisible,
  onClose,
  onConfirm,
  isLoading = false,
}: TeamAdvancementModalProps) {
  const { token } = theme.useToken();
  const [selectedTeamSlots, setSelectedTeamSlots] = useState<TeamSlot[]>([]);

  // Calculate standings for the current round
  const standings = useMemo(() => {
    if (!round) return [];

    if (round.roundType === "GROUP_BASED" && round.groups) {
      // For GROUP_BASED rounds, get standings from groups
      const allStandings: Array<{
        teamId: number;
        teamName: string;
        groupName?: string;
        position?: number;
        points?: number;
        goalDifference?: number;
        matchesPlayed?: number;
        wins?: number;
        draws?: number;
        losses?: number;
      }> = [];

      round.groups.forEach((group: RoundGroupResponse) => {
        if (group.standings && group.standings.length > 0) {
          group.standings.forEach((standing: GroupStandingResponse) => {
            allStandings.push({
              teamId: standing.teamId,
              teamName: standing.teamName,
              groupName: group.groupName,
              position: standing.position || undefined,
              points: standing.points,
              goalDifference: standing.goalDifference,
              matchesPlayed: standing.matchesPlayed,
              wins: standing.wins,
              draws: standing.draws,
              losses: standing.losses,
            });
          });
        }
      });

      // Sort by group, then by position
      return allStandings.sort((a, b) => {
        if (a.groupName !== b.groupName) {
          return (a.groupName || "").localeCompare(b.groupName || "");
        }
        return (a.position || 999) - (b.position || 999);
      });
    } else {
      // For DIRECT_KNOCKOUT rounds, calculate standings from matches
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

      // Initialize from teams
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

      // Get matches for this round
      const roundMatches = allFixtures.filter((f) => {
        const fixtureRoundNumber = f.roundNumber ?? f.round;
        const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
        const matchesByRoundId = f.round === round.id;
        return matchesByRoundNumber || matchesByRoundId;
      });

      // Process completed matches
      roundMatches.forEach((match) => {
        if (match.matchStatus !== "COMPLETED") return;

        const homeTeamId = match.homeTeamId;
        const awayTeamId = match.awayTeamId;
        const homeScore = match.homeTeamScore || 0;
        const awayScore = match.awayTeamScore || 0;

        // Initialize teams from matches if not already in stats
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

        // Update stats
        teamStats[homeTeamId].matchesPlayed++;
        teamStats[homeTeamId].goalsFor += homeScore;
        teamStats[homeTeamId].goalsAgainst += awayScore;
        teamStats[homeTeamId].goalDifference = teamStats[homeTeamId].goalsFor - teamStats[homeTeamId].goalsAgainst;

        teamStats[awayTeamId].matchesPlayed++;
        teamStats[awayTeamId].goalsFor += awayScore;
        teamStats[awayTeamId].goalsAgainst += homeScore;
        teamStats[awayTeamId].goalDifference = teamStats[awayTeamId].goalsFor - teamStats[awayTeamId].goalsAgainst;

        if (homeScore > awayScore) {
          teamStats[homeTeamId].wins++;
          teamStats[homeTeamId].points += 3;
          teamStats[awayTeamId].losses++;
        } else if (awayScore > homeScore) {
          teamStats[awayTeamId].wins++;
          teamStats[awayTeamId].points += 3;
          teamStats[homeTeamId].losses++;
        } else {
          teamStats[homeTeamId].draws++;
          teamStats[homeTeamId].points += 1;
          teamStats[awayTeamId].draws++;
          teamStats[awayTeamId].points += 1;
        }
      });

      // Convert to array and sort
      return Object.values(teamStats)
        .filter((stat) => stat.matchesPlayed > 0)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        })
        .map((stat, index) => ({
          teamId: stat.teamId,
          teamName: stat.teamName,
          position: index + 1,
          points: stat.points,
          goalDifference: stat.goalDifference,
          matchesPlayed: stat.matchesPlayed,
          wins: stat.wins,
          draws: stat.draws,
          losses: stat.losses,
        }));
    }
  }, [round, allFixtures]);

  // Initialize next round slots based on how many teams are needed
  const initializeNextRoundSlots = useMemo(() => {
    if (!nextRound) return [];
    
    // Determine how many slots are needed
    // For DIRECT_KNOCKOUT, use existing teams count or calculate from round structure
    // For GROUP_BASED, calculate total slots needed across all groups
    let slotCount = 0;
    
    if (nextRound.roundType === "GROUP_BASED" && nextRound.groups) {
      // Sum up maxTeams from all groups, or use current team count
      slotCount = nextRound.groups.reduce((sum, group) => {
        return sum + (group.maxTeams || group.teams?.length || 0);
      }, 0);
    } else {
      // DIRECT_KNOCKOUT - use existing teams count or a reasonable default
      slotCount = nextRound.teams?.length || 8;
    }
    
    // Ensure at least 2 slots for next round
    if (slotCount < 2) slotCount = 2;
    
    return Array.from({ length: slotCount }, (_, index) => ({
      teamId: null,
      teamName: null,
      seedPosition: index + 1,
    }));
  }, [nextRound]);

  // Initialize slots when modal opens
  React.useEffect(() => {
    if (isModalVisible && nextRound) {
      setSelectedTeamSlots(initializeNextRoundSlots);
    }
  }, [isModalVisible, nextRound, initializeNextRoundSlots]);

  const handleDragStart = (e: React.DragEvent, teamId: number, teamName: string) => {
    e.dataTransfer.setData("teamId", teamId.toString());
    e.dataTransfer.setData("teamName", teamName);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const teamId = parseInt(e.dataTransfer.getData("teamId"));
    const teamName = e.dataTransfer.getData("teamName");

    setSelectedTeamSlots((prev) => {
      const newSlots = [...prev];
      
      // Remove team from any other slot if already selected
      const existingSlotIndex = newSlots.findIndex((slot) => slot.teamId === teamId);
      if (existingSlotIndex !== -1) {
        newSlots[existingSlotIndex] = {
          teamId: null,
          teamName: null,
          seedPosition: existingSlotIndex + 1,
        };
      }
      
      // Add team to the new slot
      newSlots[slotIndex] = {
        teamId,
        teamName,
        seedPosition: slotIndex + 1,
      };
      return newSlots;
    });
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    setSelectedTeamSlots((prev) => {
      const newSlots = [...prev];
      newSlots[slotIndex] = {
        teamId: null,
        teamName: null,
        seedPosition: slotIndex + 1,
      };
      return newSlots;
    });
  };

  const handleConfirm = () => {
    const selectedTeamIds = selectedTeamSlots
      .filter((slot) => slot.teamId !== null)
      .map((slot) => slot.teamId!);

    if (selectedTeamIds.length === 0) {
      message.warning("Please drag at least one team to the next round slots");
      return;
    }

    onConfirm(selectedTeamIds);
  };

  const handleCancel = () => {
    setSelectedTeamSlots(initializeNextRoundSlots);
    onClose();
  };

  if (!round) {
    return null;
  }

  const hasNextRound = nextRound !== null;
  const selectedCount = selectedTeamSlots.filter((slot) => slot.teamId !== null).length;

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            Complete Round & Advance Teams
          </span>
        </Space>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={isLoading}
          onClick={handleConfirm}
        >
          Complete & Advance {selectedCount} Team{selectedCount !== 1 ? "s" : ""}
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Alert
          message={`Completing: ${round.roundName}`}
          description={
            hasNextRound
              ? `Drag teams from standings to advance them to ${nextRound.roundName}`
              : "This is the final round. No teams will advance."
          }
          type="info"
          showIcon
        />

        {!hasNextRound && (
          <Alert
            message="Final Round"
            description="This is the last round. Completing it will finish the tournament."
            type="warning"
            showIcon
          />
        )}

        {hasNextRound && (
          <Row gutter={24} style={{ minHeight: 500 }}>
            {/* Left Side - Standings */}
            <Col span={12}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined />
                    <Text strong>Round Standings</Text>
                    <Tag color="blue">{standings.length} teams</Tag>
                  </Space>
                }
                size="small"
              >
                {standings.length === 0 ? (
                  <Empty description="No standings available. Complete some matches first." />
                ) : (
                  <div style={{ maxHeight: 450, overflowY: "auto" }}>
                    {round?.roundType === "GROUP_BASED" ? (
                      // Group-based: Show standings grouped by group
                      (() => {
                        type StandingWithGroup = typeof standings[number] & { groupName?: string };
                        const groupedStandings: Record<string, StandingWithGroup[]> = {};
                        standings.forEach((standing) => {
                          const standingWithGroup = standing as StandingWithGroup;
                          const groupName = standingWithGroup.groupName || "Unknown";
                          if (!groupedStandings[groupName]) {
                            groupedStandings[groupName] = [];
                          }
                          groupedStandings[groupName].push(standingWithGroup);
                        });

                        return Object.keys(groupedStandings)
                          .sort()
                          .map((groupName) => (
                            <div key={groupName} style={{ marginBottom: 16 }}>
                              <Divider orientation="left" style={{ margin: "12px 0" }}>
                                <Space>
                                  <TeamOutlined />
                                  <Text strong style={{ fontSize: 14 }}>
                                    {groupName}
                                  </Text>
                                  <Tag color="cyan" style={{ fontSize: 11 }}>
                                    {groupedStandings[groupName].length} teams
                                  </Tag>
                                </Space>
                              </Divider>
                              {groupedStandings[groupName].map((standing) => {
                                const isSelected = selectedTeamSlots.some(
                                  (slot) => slot.teamId === standing.teamId
                                );
                                return (
                                  <Card
                                    key={standing.teamId}
                                    size="small"
                                    draggable={!isSelected}
                                    onDragStart={(e) => {
                                      if (!isSelected) {
                                        handleDragStart(e, standing.teamId, standing.teamName);
                                      } else {
                                        e.preventDefault();
                                      }
                                    }}
                                    style={{
                                      marginBottom: 8,
                                      cursor: isSelected ? "not-allowed" : "grab",
                                      opacity: isSelected ? 0.6 : 1,
                                      backgroundColor: isSelected
                                        ? token.colorFillSecondary
                                        : "transparent",
                                      border: isSelected 
                                        ? `1px dashed ${token.colorBorder}` 
                                        : `1px solid ${token.colorBorder}`,
                                    }}
                                    bodyStyle={{ padding: "12px" }}
                                  >
                                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                      <Space>
                                        <Tag color="blue" style={{ minWidth: 40, textAlign: "center" }}>
                                          {standing.position || "-"}
                                        </Tag>
                                        <TeamOutlined />
                                        <Text strong>{standing.teamName}</Text>
                                      </Space>
                                      <Space>
                                        {standing.points !== undefined && (
                                          <Text type="secondary" style={{ fontSize: 12 }}>
                                            {standing.points} pts
                                          </Text>
                                        )}
                                        {standing.goalDifference !== undefined && (
                                          <Text
                                            type="secondary"
                                            style={{
                                              fontSize: 12,
                                              color:
                                                standing.goalDifference > 0
                                                  ? token.colorSuccess
                                                  : standing.goalDifference < 0
                                                  ? token.colorError
                                                  : token.colorTextSecondary,
                                            }}
                                          >
                                            GD: {standing.goalDifference > 0 ? "+" : ""}
                                            {standing.goalDifference}
                                          </Text>
                                        )}
                                      </Space>
                                    </Space>
                                  </Card>
                                );
                              })}
                            </div>
                          ));
                      })()
                    ) : (
                      // Direct knockout: Show flat list
                      standings.map((standing) => {
                        const isSelected = selectedTeamSlots.some(
                          (slot) => slot.teamId === standing.teamId
                        );
                        return (
                          <Card
                            key={standing.teamId}
                            size="small"
                            draggable={!isSelected}
                            onDragStart={(e) => {
                              if (!isSelected) {
                                handleDragStart(e, standing.teamId, standing.teamName);
                              } else {
                                e.preventDefault();
                              }
                            }}
                            style={{
                              marginBottom: 8,
                              cursor: isSelected ? "not-allowed" : "grab",
                              opacity: isSelected ? 0.6 : 1,
                              backgroundColor: isSelected
                                ? token.colorFillSecondary
                                : "transparent",
                              border: isSelected 
                                ? `1px dashed ${token.colorBorder}` 
                                : `1px solid ${token.colorBorder}`,
                            }}
                            bodyStyle={{ padding: "12px" }}
                          >
                            <Space style={{ width: "100%", justifyContent: "space-between" }}>
                              <Space>
                                <Tag color="blue" style={{ minWidth: 40, textAlign: "center" }}>
                                  {standing.position || "-"}
                                </Tag>
                                <TeamOutlined />
                                <Text strong>{standing.teamName}</Text>
                              </Space>
                              <Space>
                                {standing.points !== undefined && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {standing.points} pts
                                  </Text>
                                )}
                                {standing.goalDifference !== undefined && (
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: 12,
                                      color:
                                        standing.goalDifference > 0
                                          ? token.colorSuccess
                                          : standing.goalDifference < 0
                                          ? token.colorError
                                          : token.colorTextSecondary,
                                    }}
                                  >
                                    GD: {standing.goalDifference > 0 ? "+" : ""}
                                    {standing.goalDifference}
                                  </Text>
                                )}
                              </Space>
                            </Space>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            </Col>

            {/* Right Side - Next Round Slots */}
            <Col span={12}>
              <Card
                title={
                  <Space>
                    <TrophyOutlined />
                    <Text strong>{nextRound?.roundName || "Next Round"}</Text>
                    <Tag color="green">{selectedCount} / {selectedTeamSlots.length} slots</Tag>
                  </Space>
                }
                size="small"
              >
                <div style={{ maxHeight: 450, overflowY: "auto" }}>
                  {selectedTeamSlots.map((slot, index) => (
                    <Card
                      key={index}
                      size="small"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        marginBottom: 8,
                        minHeight: 60,
                        border: slot.teamId
                          ? `2px solid ${token.colorSuccess}`
                          : `2px dashed ${token.colorBorder}`,
                        backgroundColor: slot.teamId 
                          ? token.colorSuccessBg 
                          : token.colorFillSecondary,
                      }}
                      bodyStyle={{ padding: "12px" }}
                    >
                      {slot.teamId ? (
                        <Space
                          style={{ width: "100%", justifyContent: "space-between" }}
                        >
                          <Space>
                            <Tag color="green" style={{ minWidth: 40, textAlign: "center" }}>
                              {slot.seedPosition}
                            </Tag>
                            <TeamOutlined />
                            <Text strong>{slot.teamName}</Text>
                          </Space>
                          <Button
                            size="small"
                            danger
                            type="text"
                            onClick={() => handleRemoveFromSlot(index)}
                          >
                            Remove
                          </Button>
                        </Space>
                      ) : (
                        <Space
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            color: token.colorTextDisabled,
                          }}
                        >
                          <ArrowRightOutlined />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Drop team here (Slot {slot.seedPosition})
                          </Text>
                        </Space>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Space>
    </Modal>
  );
}
