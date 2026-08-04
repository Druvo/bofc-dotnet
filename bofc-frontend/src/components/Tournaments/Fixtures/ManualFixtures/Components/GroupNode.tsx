import { memo, useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { Card, Tag, Space, Typography, Badge, Divider, theme } from "antd";
import { TeamOutlined, TrophyOutlined, ClockCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";
import { club } from "../../../../../theme/clubTheme";
import { formatMatchTime, isMatchOngoing, calculateElapsedTime } from "../../../../../utils/matchTimeUtils";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;
const { useToken } = theme;

interface GroupNodeData {
  groupName: string;
  teamCount: number;
  maxTeams?: number;
  totalMatches: number;
  completedMatches: number;
  status: string;
  groupId?: number;
  teams?: any[];
  matches?: any[];
  ongoingMatches?: IFixture[];
  standings?: any[];
  onAssignTeams?: (groupId: number) => void;
}

interface GroupNodeProps {
  data: GroupNodeData;
  selected?: boolean;
}

/**
 * GroupNode - Visual node for groups in React Flow
 */
function GroupNode({ data, selected }: GroupNodeProps) {
  const navigate = useNavigate();
  const { token } = useToken();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const ongoingMatches = data.ongoingMatches || [];

  // Update time every second for ongoing matches
  useEffect(() => {
    if (ongoingMatches.length === 0) {
      setCurrentTime(Date.now()); // Set once if no ongoing matches
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [ongoingMatches.length]); // Only depend on ongoingMatches.length

  const getStatusColor = () => {
    switch (data.status) {
      case "COMPLETED":
        return club.pitch;
      case "ONGOING":
        return club.live;
      default:
        return "#d9d9d9";
    }
  };

  const completionPercent =
    data.totalMatches > 0 ? Math.round((data.completedMatches / data.totalMatches) * 100) : 0;

  const hasTeams = (data.teamCount || 0) > 0;
  const teamsList = (data.teams || []).filter((t: any) => !t.isPlaceholder);
  const matchesList = data.matches || [];
  const hasMatches = matchesList.length > 0;
  const standingsList = data.standings || [];
  const hasStandings = standingsList.length > 0 && data.totalMatches > 0;

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return club.pitch;
      case "ONGOING":
        return club.live;
      case "SCHEDULED":
        return "#d9d9d9";
      default:
        return "#d9d9d9";
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <div style={{ position: "relative" }}>
        <Card
          size="small"
          style={{
            width: 280,
            backgroundColor: token.colorBgContainer,
            border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            boxShadow: selected ? `0 4px 12px ${token.colorPrimary}40` : token.boxShadow,
            cursor: "pointer",
          }}
          bodyStyle={{ padding: "12px", maxHeight: "400px", overflowY: "auto" }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {/* Header */}
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space size={4}>
                <TeamOutlined style={{ color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 13, color: token.colorText }}>
                  {data.groupName}
                </Text>
                {ongoingMatches.length > 0 && (
                  <Tag color="error" style={{ margin: 0, padding: "0 6px", fontSize: 10 }}>
                    🔴 {ongoingMatches.length} Live
                  </Tag>
                )}
              </Space>
              <Badge
                count={data.teamCount}
                showZero
                style={{ backgroundColor: token.colorPrimary }}
                title={`${data.teamCount} teams`}
              />
            </Space>

            {/* Stats */}
            <Space size={4} wrap>
              <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                {data.teamCount}{data.maxTeams ? `/${data.maxTeams}` : ""} Teams
              </Tag>
              <Tag color="green" style={{ fontSize: 11, margin: 0 }}>
                {data.completedMatches}/{data.totalMatches} Matches
              </Tag>
            </Space>

            {/* Progress */}
            {data.totalMatches > 0 && (
              <div
                style={{
                  width: "100%",
                  height: 3,
                  backgroundColor: token.colorFillSecondary,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${completionPercent}%`,
                    height: "100%",
                    backgroundColor: getStatusColor(),
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            )}

            {/* Teams List */}
            {teamsList.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <div>
                  <Text strong style={{ fontSize: 11, color: "#8c8c8c" }}>Teams:</Text>
                  <Space direction="vertical" size={4} style={{ width: "100%", marginTop: 4 }}>
                    {teamsList.slice(0, 4).map((team: any, idx: number) => (
                      <Space key={idx} size={4}>
                        {team.isPlaceholder ? (
                          <ClockCircleOutlined style={{ color: "#faad14", fontSize: 12 }} />
                        ) : (
                          <TeamOutlined style={{ color: "#c6a15b", fontSize: 12 }} />
                        )}
                        <Text style={{ fontSize: 11 }}>
                          {team.teamName || team.placeholderName || "TBD"}
                        </Text>
                      </Space>
                    ))}
                    {teamsList.length > 4 && (
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        +{teamsList.length - 4} more
                      </Text>
                    )}
                  </Space>
                </div>
              </>
            )}

            {/* Standings/Score Table */}
            {hasStandings && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <div>
                  <Text strong style={{ fontSize: 11, color: "#8c8c8c" }}>Standings:</Text>
                  <div style={{ marginTop: 4, fontSize: 9 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <th style={{ padding: "2px 4px", textAlign: "left", fontSize: 9, fontWeight: "bold" }}>Pos</th>
                          <th style={{ padding: "2px 4px", textAlign: "left", fontSize: 9, fontWeight: "bold" }}>Team</th>
                          <th style={{ padding: "2px 4px", textAlign: "center", fontSize: 9, fontWeight: "bold" }}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsList.slice(0, 4).map((standing: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f5f5f5" }}>
                            <td style={{ padding: "2px 4px", fontSize: 9 }}>
                              <Tag color={standing.position === 1 ? "gold" : standing.position === 2 ? "default" : undefined} style={{ fontSize: 8, margin: 0, padding: "0 2px" }}>
                                {standing.position}
                              </Tag>
                            </td>
                            <td style={{ padding: "2px 4px", fontSize: 9 }}>
                              <Text style={{ fontSize: 9 }}>{standing.teamName}</Text>
                            </td>
                            <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 9, fontWeight: "bold" }}>
                              {standing.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {standingsList.length > 4 && (
                      <Text type="secondary" style={{ fontSize: 9, marginTop: 4, display: "block" }}>
                        +{standingsList.length - 4} more teams
                      </Text>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Ongoing Matches */}
            {ongoingMatches.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <div>
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
                            fontSize: 10,
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
                              <Text strong style={{ fontSize: 10, color: token.colorText }}>
                                {match.homeTeamName}
                              </Text>
                              <Text style={{ fontSize: 10, fontWeight: "bold", color: token.colorText }}>
                                {match.homeTeamScore} - {match.awayTeamScore}
                              </Text>
                              <Text strong style={{ fontSize: 10, color: token.colorText }}>
                                {match.awayTeamName}
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
              </>
            )}

            {/* Matches/Fixtures */}
            {hasMatches && !hasStandings && ongoingMatches.length === 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <div>
                  <Text strong style={{ fontSize: 11, color: "#8c8c8c" }}>Fixtures:</Text>
                  <Space direction="vertical" size={4} style={{ width: "100%", marginTop: 4 }}>
                    {matchesList.slice(0, 3).map((match: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#f5f5f5",
                          borderRadius: 4,
                          fontSize: 10,
                        }}
                      >
                        <Space size={4} style={{ width: "100%", justifyContent: "space-between" }}>
                          <Space size={4}>
                            <Text strong style={{ fontSize: 10 }}>
                              {match.homeTeamName}
                            </Text>
                            {match.matchStatus === "COMPLETED" ? (
                              <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                                {match.homeTeamScore} - {match.awayTeamScore}
                              </Text>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 10 }}>vs</Text>
                            )}
                            <Text strong style={{ fontSize: 10 }}>
                              {match.awayTeamName}
                            </Text>
                          </Space>
                          <Tag
                            color={getMatchStatusColor(match.matchStatus)}
                            style={{ fontSize: 9, margin: 0, padding: "0 4px" }}
                          >
                            {match.matchStatus === "COMPLETED" ? (
                              <TrophyOutlined style={{ fontSize: 9 }} />
                            ) : (
                              <ClockCircleOutlined style={{ fontSize: 9 }} />
                            )}
                          </Tag>
                        </Space>
                      </div>
                    ))}
                    {matchesList.length > 3 && (
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        +{matchesList.length - 3} more matches
                      </Text>
                    )}
                  </Space>
                </div>
              </>
            )}
          </Space>
        </Card>
      </div>
    </>
  );
}

export default memo(GroupNode);
