import React from "react";
import { Card, Row, Col, Table, Spin, Alert, Avatar, Typography, Statistic } from "antd";
import { TrophyOutlined, TeamOutlined, FireOutlined, RiseOutlined } from "@ant-design/icons";
import {
  useGetMatchDayStandingsQuery,
  useGetTopScorersQuery,
  useGetTopAssistsQuery,
} from "../../../../../state/features/statistics/statisticsSlice";
import type { IMatchStatistics, IMatchDayStanding, IMatchDayTopScorer } from "../../../../../state/features/statistics/statisticsTypes";
import type { ColumnsType } from "antd/es/table";
import { club } from "../../../../../theme/clubTheme";

const { Title, Text } = Typography;

interface StatisticsTabProps {
  matchDayId: number;
  isActive: boolean;
}

// Player Card Component with first letter display for top scorers
const PlayerCardForScorers: React.FC<{
  player: IMatchDayTopScorer;
  rank: number;
  statValue: number;
  statLabel: string;
  icon: React.ReactNode;
}> = ({ player, rank, statValue, statLabel, icon }) => {
  // Get first letter of player name
  const firstLetter = player.playerName?.charAt(0).toUpperCase() || "?";

  // Different colors for top 3
  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#28552B"; // Default - brand green
  };

  return (
    <Card
      hoverable
      style={{
        borderRadius: 12,
        background: `linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(24, 144, 255, 0.02) 100%)`,
        border: rank <= 3 ? `2px solid ${getRankColor(rank)}` : undefined,
        position: "relative",
      }}
    >
      {/* Rank Badge */}
      <div
        style={{
          position: "absolute",
          top: -10,
          left: -10,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: getRankColor(rank),
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {rank}
      </div>

      <Row gutter={16} align="middle">
        {/* Player Avatar with First Letter */}
        <Col>
          <div
            style={{
              position: "relative",
              width: 80,
              height: 100,
              backgroundImage: `url('/playerCard.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "#fff",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {firstLetter}
            </Text>
          </div>
        </Col>

        {/* Player Info */}
        <Col flex={1}>
          <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
            {player.playerName}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {player.teamName}
          </Text>
          <div style={{ marginTop: 12 }}>
            <Row align="middle" gutter={8}>
              <Col>{icon}</Col>
              <Col>
                <Statistic
                  value={statValue}
                  suffix={statLabel}
                  valueStyle={{ fontSize: 20, fontWeight: "bold" }}
                />
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

// Player Card Component for assists (uses IMatchStatistics)
const PlayerCardForAssists: React.FC<{
  player: IMatchStatistics;
  rank: number;
  statValue: number;
  statLabel: string;
  icon: React.ReactNode;
}> = ({ player, rank, statValue, statLabel, icon }) => {
  // Get first letter of player name
  const firstLetter = player.playerName?.charAt(0).toUpperCase() || "?";

  // Different colors for top 3
  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#28552B"; // Default - brand green
  };

  return (
    <Card
      hoverable
      style={{
        borderRadius: 12,
        background: `linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(24, 144, 255, 0.02) 100%)`,
        border: rank <= 3 ? `2px solid ${getRankColor(rank)}` : undefined,
        position: "relative",
      }}
    >
      {/* Rank Badge */}
      <div
        style={{
          position: "absolute",
          top: -10,
          left: -10,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: getRankColor(rank),
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {rank}
      </div>

      <Row gutter={16} align="middle">
        {/* Player Avatar with First Letter */}
        <Col>
          <div
            style={{
              position: "relative",
              width: 80,
              height: 100,
              backgroundImage: `url('/playerCard.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "#fff",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {firstLetter}
            </Text>
          </div>
        </Col>

        {/* Player Info */}
        <Col flex={1}>
          <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
            {player.playerName}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {player.teamName}
          </Text>
          <div style={{ marginTop: 12 }}>
            <Row align="middle" gutter={8}>
              <Col>{icon}</Col>
              <Col>
                <Statistic
                  value={statValue}
                  suffix={statLabel}
                  valueStyle={{ fontSize: 20, fontWeight: "bold" }}
                />
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default function StatisticsTab({ matchDayId, isActive }: StatisticsTabProps) {
  const {
    data: standingsData,
    isLoading: standingsLoading,
    error: standingsError,
  } = useGetMatchDayStandingsQuery(
    { matchDayId },
    { skip: !isActive || !matchDayId }
  );

  const {
    data: topScorersData,
    isLoading: scorersLoading,
    error: scorersError,
  } = useGetTopScorersQuery(
    { matchDayId },
    { skip: !isActive || !matchDayId }
  );

  const {
    data: topAssistsData,
    isLoading: assistsLoading,
    error: assistsError,
  } = useGetTopAssistsQuery(
    { matchDayId },
    { skip: !isActive || !matchDayId }
  );

  const isLoading = standingsLoading || scorersLoading || assistsLoading;
  const hasError = standingsError || scorersError || assistsError;

  // Team Standings Table Columns
  const standingsColumns: ColumnsType<IMatchDayStanding> = [
    {
      title: "Pos",
      key: "position",
      width: 60,
      align: "center",
      render: (_, __, index) => (
        <Avatar
          size="small"
          style={{
            backgroundColor: index < 3 ? club.pitch : club.navy,
            fontWeight: "bold",
          }}
        >
          {index + 1}
        </Avatar>
      ),
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      render: (name: string) => (
        <Text strong>
          <TeamOutlined style={{ marginRight: 8 }} />
          {name}
        </Text>
      ),
    },
    {
      title: "MP",
      dataIndex: "matches",
      key: "matches",
      width: 60,
      align: "center",
    },
    {
      title: "W",
      dataIndex: "wins",
      key: "wins",
      width: 60,
      align: "center",
    },
    {
      title: "D",
      dataIndex: "draws",
      key: "draws",
      width: 60,
      align: "center",
    },
    {
      title: "L",
      dataIndex: "losses",
      key: "losses",
      width: 60,
      align: "center",
    },
    {
      title: "GF",
      dataIndex: "goalsFor",
      key: "goalsFor",
      width: 60,
      align: "center",
    },
    {
      title: "GA",
      dataIndex: "goalsAgainst",
      key: "goalsAgainst",
      width: 60,
      align: "center",
    },
    {
      title: "GD",
      dataIndex: "goalDifference",
      key: "goalDifference",
      width: 60,
      align: "center",
      render: (value: number) => (
        <Text style={{ color: value > 0 ? "#52c41a" : value < 0 ? "#ff4d4f" : undefined }}>
          {value > 0 ? "+" : ""}
          {value}
        </Text>
      ),
    },
    {
      title: "Pts",
      dataIndex: "points",
      key: "points",
      width: 70,
      align: "center",
      render: (points: number) => (
        <Text strong style={{ fontSize: 16, color: "#c6a15b" }}>
          {points}
        </Text>
      ),
    },
  ];

  if (hasError) {
    return (
      <Alert
        message="Error Loading Statistics"
        description="Failed to load Match Day statistics. Please try again later."
        type="error"
        showIcon
      />
    );
  }

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: "16px 0" }}>
        {/* Team Standings */}
        <Card
          title={
            <span>
              <TrophyOutlined style={{ marginRight: 8 }} />
              Match Day Standings
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          <Table
            dataSource={standingsData?.content || []}
            columns={standingsColumns}
            rowKey="teamId"
            pagination={false}
            size="small"
          />
        </Card>

        {/* Top Scorers */}
        <Card
          title={
            <span>
              <FireOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />
              Top Scorers
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            {topScorersData?.content?.slice(0, 10).map((player, index) => (
              <Col xs={24} sm={12} md={12} lg={8} key={player.playerId}>
                <PlayerCardForScorers
                  player={player}
                  rank={index + 1}
                  statValue={player.goalsScored}
                  statLabel="Goals"
                  icon={<FireOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />}
                />
              </Col>
            ))}
          </Row>
          {(!topScorersData?.content || topScorersData.content.length === 0) && (
            <Alert
              message="No goal scorers yet"
              description="Statistics will appear once matches are played."
              type="info"
              showIcon
            />
          )}
        </Card>

        {/* Top Assists */}
        <Card
          title={
            <span>
              <RiseOutlined style={{ marginRight: 8, color: "#52c41a" }} />
              Top Assists
            </span>
          }
        >
          <Row gutter={[16, 16]}>
            {topAssistsData?.content?.slice(0, 10).map((player, index) => (
              <Col xs={24} sm={12} md={12} lg={8} key={player.id}>
                <PlayerCardForAssists
                  player={player}
                  rank={index + 1}
                  statValue={player.assists}
                  statLabel="Assists"
                  icon={<RiseOutlined style={{ fontSize: 20, color: "#52c41a" }} />}
                />
              </Col>
            ))}
          </Row>
          {(!topAssistsData?.content || topAssistsData.content.length === 0) && (
            <Alert
              message="No assists yet"
              description="Statistics will appear once matches are played."
              type="info"
              showIcon
            />
          )}
        </Card>
      </div>
    </Spin>
  );
}
