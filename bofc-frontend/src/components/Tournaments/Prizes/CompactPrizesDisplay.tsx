import React from "react";
import { Card, Typography, Row, Col, Space, Divider, theme } from "antd";
import { TrophyOutlined, TeamOutlined, UserOutlined, CrownOutlined } from "@ant-design/icons";
import { useGetTournamentPrizesQuery } from "../../../state/features/prizes/prizesSlice";
import { PrizeType } from "../../../state/features/prizes/prizeTypes";

const { Title, Text } = Typography;

interface CompactPrizesDisplayProps {
  tournamentId: number;
}

export default function CompactPrizesDisplay({
  tournamentId,
}: CompactPrizesDisplayProps) {
  const { token } = theme.useToken();
  const { data: prizesData, isLoading } = useGetTournamentPrizesQuery(
    { tournamentId },
    { skip: !tournamentId }
  );

  const prizes = prizesData?.content || [];

  if (isLoading || prizes.length === 0) {
    return null; // Don't show anything if no prizes
  }

  // Separate team and player prizes
  const teamPrizes = prizes.filter((p) => p.prizeType === PrizeType.TEAM);
  const playerPrizes = prizes.filter((p) => p.prizeType === PrizeType.PLAYER);

  const getRankBadge = (rank: number, category: string) => {
    // First check if category gives us specific information
    const categoryMap: Record<string, { icon: string; color: string; label: string }> = {
      CHAMPION: { icon: "🥇", color: "#FFD700", label: "Champion" },
      RUNNER_UP: { icon: "🥈", color: "#C0C0C0", label: "Runner-up" },
      THIRD_PLACE: { icon: "🥉", color: "#CD7F32", label: "3rd Place" },
      FOURTH_PLACE: { icon: "🏅", color: "#8B7355", label: "4th Place" },
    };

    // Use category if available in map
    if (categoryMap[category]) {
      return categoryMap[category];
    }

    // Fall back to rank-based badges
    switch (rank) {
      case 1:
        return { icon: "🥇", color: "#FFD700", label: "1st Place" };
      case 2:
        return { icon: "🥈", color: "#C0C0C0", label: "2nd Place" };
      case 3:
        return { icon: "🥉", color: "#CD7F32", label: "3rd Place" };
      default:
        return { icon: "🏆", color: token.colorPrimary, label: `${rank}th Place` };
    }
  };

  const formatCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const renderPrizeCard = (prize: any) => {
    const badge = getRankBadge(prize.positionRank, prize.prizeCategory);
    const isTeam = prize.prizeType === PrizeType.TEAM;

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={prize.id}>
        <Card
          size="small"
          style={{
            borderRadius: 12,
            border: `2px solid ${badge.color}`,
            background: token.colorBgContainer,
            height: "100%",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: 16 }}
          hoverable
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {/* Rank Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 36 }}>{badge.icon}</span>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 16,
                  background: badge.color,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: "bold",
                  boxShadow: `0 2px 8px ${badge.color}40`,
                }}
              >
                {badge.label}
              </div>
            </div>

            {/* Prize Category */}
            <Text
              strong
              style={{
                fontSize: 15,
                color: token.colorText,
                display: "block",
                marginBottom: 4,
              }}
            >
              {formatCategoryLabel(prize.prizeCategory)}
            </Text>

            {/* Winner Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: token.colorBgLayout,
                borderRadius: 8,
              }}
            >
              {isTeam ? (
                <TeamOutlined style={{ color: badge.color, fontSize: 20 }} />
              ) : (
                <UserOutlined style={{ color: badge.color, fontSize: 20 }} />
              )}
              <Text strong style={{ fontSize: 15, flex: 1 }}>
                {isTeam ? prize.teamName : prize.playerName}
              </Text>
            </div>

            {/* Prize Amount */}
            {prize.prizeAmount && (
              <div
                style={{
                  textAlign: "center",
                  padding: "8px",
                  background: `linear-gradient(135deg, ${badge.color}20, ${badge.color}10)`,
                  borderRadius: 8,
                  border: `1px solid ${badge.color}30`,
                }}
              >
                <Text strong style={{ color: badge.color, fontSize: 17 }}>
                  ${prize.prizeAmount.toLocaleString()}
                </Text>
              </div>
            )}
          </Space>
        </Card>
      </Col>
    );
  };

  return (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: 16,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <div 
          style={{ 
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          <Space size="middle" align="center">
            <div
              style={{
                fontSize: 32,
                filter: "drop-shadow(0 2px 4px rgba(255, 215, 0, 0.4))",
              }}
            >
              🏆
            </div>
            <Title 
              level={3} 
              style={{ 
                margin: 0,
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: "bold",
              }}
            >
              Tournament Prizes & Awards
            </Title>
          </Space>
        </div>

        {/* Team Prizes Section */}
        {teamPrizes.length > 0 && (
          <div>
            <Divider orientation="left">
              <Space>
                <TeamOutlined style={{ color: "#c6a15b", fontSize: 20 }} />
                <Text strong style={{ fontSize: 17, color: token.colorText }}>
                  Team Awards ({teamPrizes.length})
                </Text>
              </Space>
            </Divider>
            <Row gutter={[16, 16]}>{teamPrizes.map(renderPrizeCard)}</Row>
          </div>
        )}

        {/* Player Prizes Section */}
        {playerPrizes.length > 0 && (
          <div>
            <Divider orientation="left">
              <Space>
                <UserOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                <Text strong style={{ fontSize: 17, color: token.colorText }}>
                  Individual Awards ({playerPrizes.length})
                </Text>
              </Space>
            </Divider>
            <Row gutter={[16, 16]}>{playerPrizes.map(renderPrizeCard)}</Row>
          </div>
        )}
      </Space>
    </Card>
  );
}
