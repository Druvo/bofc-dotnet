import { memo, useEffect, useState, useMemo } from "react";
import { Handle, Position } from "reactflow";
import { Card, Tag, Space, Typography, Button, theme, Table } from "antd";
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, ThunderboltOutlined, PlayCircleOutlined, BarChartOutlined } from "@ant-design/icons";
import { RoundStatus, RoundType } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";
import { formatMatchTime, isMatchOngoing, calculateElapsedTime } from "../../../../../utils/matchTimeUtils";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;
const { useToken } = theme;

interface RoundNodeData {
  roundName: string;
  roundType: string;
  status: RoundStatus;
  totalMatches: number;
  completedMatches: number;
  sequenceOrder: number;
  roundId?: number;
  groups?: any[];
  teams?: any[];
  ongoingMatches?: IFixture[];
  allMatches?: IFixture[];
  isHovered?: boolean;
  onHover?: (roundId: number | null) => void;
  onCreateGroup?: (roundId: number) => void;
  onCreateRound?: (sourceRoundId?: number) => void;
  onGenerateMatches?: (roundId: number) => void;
}

interface RoundNodeProps {
  data: RoundNodeData;
  selected?: boolean;
}

/**
 * RoundNode - Visual node for tournament rounds in React Flow
 */
function RoundNode({ data, selected }: RoundNodeProps) {
  const navigate = useNavigate();
  const { token } = useToken();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const ongoingMatches = data.ongoingMatches || [];

  // Update time every second for ongoing matches
  useEffect(() => {
    if (ongoingMatches.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [ongoingMatches.length]);

  const getStatusColor = () => {
    switch (data.status) {
      case "COMPLETED":
        return token.colorSuccess;
      case "ONGOING":
        return token.colorInfo;
      default:
        // NOT_STARTED or other statuses - use theme-aware secondary text color
        return token.colorTextSecondary;
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case "COMPLETED":
        return <CheckCircleOutlined />;
      case "ONGOING":
        return <ClockCircleOutlined spin />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const isGroupBased = data.roundType === RoundType.GROUP_BASED;
  const isHovered = data.isHovered || false;
  const allMatches = data.allMatches || [];
  const teams = data.teams || [];

  // Calculate standings for DIRECT_KNOCKOUT rounds
  const standings = useMemo(() => {
    if (isGroupBased || allMatches.length === 0) return [];

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

    // Initialize team stats from teams if available
    teams.forEach((team: any) => {
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

    // Process completed matches
    allMatches.forEach((match) => {
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

      // Update home team stats
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

      // Update away team stats
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

    // Convert to array and sort by points, goal difference, goals for
    return Object.values(teamStats)
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
  }, [isGroupBased, allMatches, teams]);

  return (
    <>
      <Handle type="target" position={Position.Left} id="left" />
      {/* Left source handle for connecting groups */}
      {isGroupBased && <Handle type="source" position={Position.Left} id="left-source" />}
      <div
        onMouseEnter={() => data.onHover && data.roundId && data.onHover(data.roundId)}
        onMouseLeave={() => data.onHover && data.onHover(null)}
        style={{ position: "relative" }}
      >
        <Card
          size="small"
          style={{
            width: 280,
            backgroundColor: token.colorBgContainer,
            borderTop: selected ? `2px solid ${token.colorPrimary}` : isHovered ? `2px solid ${token.colorSuccess}` : `1px solid ${token.colorBorder}`,
            borderRight: selected ? `2px solid ${token.colorPrimary}` : isHovered ? `2px solid ${token.colorSuccess}` : `1px solid ${token.colorBorder}`,
            borderBottom: selected ? `2px solid ${token.colorPrimary}` : isHovered ? `2px solid ${token.colorSuccess}` : `1px solid ${token.colorBorder}`,
            borderLeft: `4px solid ${getStatusColor()}`,
            boxShadow: selected ? `0 4px 12px ${token.colorPrimary}40` : isHovered ? `0 4px 12px ${token.colorSuccess}40` : token.boxShadow,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          bodyStyle={{ padding: "16px", minHeight: "200px" }}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {/* Header */}
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space>
                <TrophyOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 14, color: token.colorText }}>
                  {data.roundName}
                </Text>
                {ongoingMatches.length > 0 && (
                  <Tag color="error" style={{ margin: 0, padding: "0 6px" }}>
                    🔴 {ongoingMatches.length} Live
                  </Tag>
                )}
              </Space>
              <Tag color={getStatusColor()} icon={getStatusIcon()} style={{ margin: 0 }}>
                {data.status}
              </Tag>
            </Space>

            {/* Details */}
            <Space size={4} direction="vertical" style={{ width: "100%" }}>
              <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                Type: <Text strong style={{ color: token.colorText }}>{data.roundType.replace("_", " ")}</Text>
              </Text>
              <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                Matches: <Text strong style={{ color: token.colorText }}>{data.completedMatches} / {data.totalMatches}</Text>
              </Text>
              {isGroupBased && data.groups && (
                <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                  Groups: <Text strong style={{ color: token.colorText }}>{data.groups.length}</Text>
                </Text>
              )}
            </Space>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: 4,
                backgroundColor: token.colorFillSecondary,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${data.totalMatches > 0 ? (data.completedMatches / data.totalMatches) * 100 : 0}%`,
                  height: "100%",
                  backgroundColor: getStatusColor(),
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Ongoing Matches */}
            {ongoingMatches.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 11, color: token.colorTextSecondary }}>
                  🔴 Live Matches:
                </Text>
                <Space direction="vertical" size={4} style={{ width: "100%", marginTop: 4 }}>
                  {ongoingMatches.slice(0, 2).map((match: IFixture) => {
                    // Use currentTime to force re-render when time updates
                    // The formatMatchTime uses Date.now() internally, but referencing currentTime ensures re-render
                    const _ = currentTime; // Reference currentTime to trigger re-render
                    const matchTime = formatMatchTime(
                      match.matchStatus,
                      match.startedAt,
                      match.elapsedTimeSeconds,
                      match.completedAt
                    );
                    return (
                      <div
                        key={match.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/fixtures/${match.id}`);
                        }}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: token.colorSuccessBg,
                          borderRadius: 4,
                          cursor: "pointer",
                          border: `1px solid ${token.colorSuccess}`,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = token.colorSuccessBgHover;
                          e.currentTarget.style.boxShadow = `0 2px 4px ${token.colorSuccess}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = token.colorSuccessBg;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Space size={4} style={{ width: "100%", justifyContent: "space-between" }}>
                          <Space size={4} style={{ flex: 1, minWidth: 0 }}>
                            <PlayCircleOutlined style={{ color: token.colorSuccess, fontSize: 12 }} />
                            <Text style={{ fontSize: 10, color: token.colorText }} ellipsis>
                              {match.homeTeamName} vs {match.awayTeamName}
                            </Text>
                          </Space>
                          {matchTime && (
                            <Tag
                              color="success"
                              style={{
                                fontSize: 11,
                                fontWeight: "bold",
                                margin: 0,
                                padding: "2px 8px",
                                cursor: "pointer",
                                fontFamily: "monospace",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/fixtures/${match.id}`);
                              }}
                            >
                              {matchTime}
                            </Tag>
                          )}
                        </Space>
                      </div>
                    );
                  })}
                  {ongoingMatches.length > 2 && (
                    <Text style={{ fontSize: 9, color: token.colorTextSecondary }}>
                      +{ongoingMatches.length - 2} more live
                    </Text>
                  )}
                </Space>
              </div>
            )}

            {/* Standings for DIRECT_KNOCKOUT rounds */}
            {!isGroupBased && standings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 11, color: token.colorTextSecondary }}>
                    <BarChartOutlined /> Standings:
                  </Text>
                </Space>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  <Table
                    dataSource={standings.slice(0, 5)}
                    pagination={false}
                    size="small"
                    showHeader={false}
                    style={{ fontSize: 10 }}
                    columns={[
                      {
                        title: "Pos",
                        dataIndex: "position",
                        key: "position",
                        width: 30,
                        render: (pos: number) => (
                          <Text strong style={{ fontSize: 10 }}>{pos}</Text>
                        ),
                      },
                      {
                        title: "Team",
                        dataIndex: "teamName",
                        key: "teamName",
                        ellipsis: true,
                        render: (name: string) => (
                          <Text style={{ fontSize: 10 }} ellipsis>{name}</Text>
                        ),
                      },
                      {
                        title: "Pts",
                        dataIndex: "points",
                        key: "points",
                        width: 35,
                        align: "right" as const,
                        render: (pts: number) => (
                          <Text strong style={{ fontSize: 10 }}>{pts}</Text>
                        ),
                      },
                    ]}
                    rowKey="id"
                  />
                </div>
                {standings.length > 5 && (
                  <Text style={{ fontSize: 9, color: token.colorTextSecondary, textAlign: "center", display: "block", marginTop: 4 }}>
                    +{standings.length - 5} more teams
                  </Text>
                )}
              </div>
            )}

            {/* Generate Matches Button */}
            {data.onGenerateMatches && data.roundId && (
              <Button
                type="primary"
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onGenerateMatches && data.roundId && data.onGenerateMatches(data.roundId);
                }}
                block
                style={{ marginTop: 8 }}
              >
                Generate Fixtures
              </Button>
            )}
          </Space>
        </Card>

        {/* Hover Controls */}
        {isGroupBased && data.onCreateGroup && data.roundId && (
          <div
            style={{
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? "auto" : "none",
              transition: "opacity 0.2s ease",
            }}
          >
            {/* Bottom Add Icon - Add Group */}
            <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              size="small"
              style={{
                position: "absolute",
                bottom: -12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                data.onCreateGroup && data.roundId && data.onCreateGroup(data.roundId);
              }}
            />
            {/* Right Add Icon - Add Next Round */}
            {data.onCreateRound && (
              <Button
                type="default"
                shape="circle"
                icon={<PlusOutlined />}
                size="small"
                style={{
                  position: "absolute",
                  right: -12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onCreateRound && data.onCreateRound(data.roundId);
                }}
              />
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="right" />
    </>
  );
}

export default memo(RoundNode);
