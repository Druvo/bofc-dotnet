import React, { useState } from "react";
import {
  Modal,
  Card,
  Tag,
  Spin,
  Tabs,
  theme,
} from "antd";
import Title from "antd/es/typography/Title";
import logo from "../../../assets/logo.png";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { getStatusColor } from "../../../utils/matchStatusUtils";
import MatchLivePanel from "./MatchLivePanel";
import MatchCountdown from "./MatchCountdown";
import MatchStatistics from "./MatchStatistics";
import MatchEventTimeline from "./MatchEventTimeline";
import QuickEventRecorder from "./QuickEventRecorder";

interface MatchDetailsModalProps {
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  match: IFixture | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  teamPlayersMap?: Record<number, Array<{ id: number; name: string }>>;
}

const { useToken } = theme;

export default function MatchDetailsModal({
  isModalVisible,
  handleSetIsModalVisible,
  match,
  isLoading = false,
  onRefresh,
  teamPlayersMap = {},
}: MatchDetailsModalProps) {
  const { token } = useToken();

  if (!match) {
    return null;
  }

  const handleCancel = () => {
    handleSetIsModalVisible(false);
  };

  const handleModalRefresh = () => {
    onRefresh?.();
  };

  return (
    <Modal
      title={
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            margin: "-20px -24px 20px -24px",
            padding: "20px 24px",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Title level={3} style={{ margin: 0, color: "white" }}>
            Match Details
          </Title>
        </div>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      footer={null}
      width={920}
      bodyStyle={{
        maxHeight: "80vh",
        overflowY: "auto",
        padding: "24px",
        background: token.colorBgContainer,
      }}
      style={{ top: 20 }}
    >
      <Spin spinning={isLoading}>
        <div style={{ padding: "0" }}>
          {/* Premier League Style Score Card */}
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(56, 0, 60, 0.4)",
              border: "none",
              background: "linear-gradient(135deg, #38003c 0%, #570a57 100%)",
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Logo Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "12px 0 10px 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <img
                src={logo}
                alt="League Logo"
                style={{
                  height: 40,
                  width: "auto",
                  filter: "brightness(0) invert(1)",
                }}
              />
            </div>

            {/* Score Display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                position: "relative",
              }}
            >
              {/* Left Side Color Bar */}
              <div
                style={{
                  width: 4,
                  height: 60,
                  background: "#e90052",
                  borderRadius: 2,
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />

              {/* Home Team */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 16,
                }}
              >
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: 20,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {match.homeTeamName}
                </Title>
              </div>

              {/* Score Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#00ff85",
                  padding: "10px 20px",
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#38003c",
                    lineHeight: 1,
                    minWidth: 28,
                    textAlign: "center",
                  }}
                >
                  {match.homeTeamScore}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#38003c",
                    opacity: 0.6,
                  }}
                >
                  -
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#38003c",
                    lineHeight: 1,
                    minWidth: 28,
                    textAlign: "center",
                  }}
                >
                  {match.awayTeamScore}
                </div>
              </div>

              {/* Away Team */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingLeft: 16,
                }}
              >
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: 20,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {match.awayTeamName}
                </Title>
              </div>

              {/* Right Side Color Bar */}
              <div
                style={{
                  width: 4,
                  height: 60,
                  background: "#e90052",
                  borderRadius: 2,
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </div>

            {/* Match Status Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "10px 0",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                gap: 8,
              }}
            >
              <Tag
                color={getStatusColor(match.matchStatus)}
                style={{
                  fontSize: 10,
                  padding: "3px 10px",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: 0,
                }}
              >
                {match.matchStatus}
              </Tag>
            </div>
          </Card>

          {/* Match Controls */}
          <div style={{ marginBottom: 24 }}>
            <MatchLivePanel fixture={match} onSuccess={handleModalRefresh} />
          </div>

          <Tabs
            defaultActiveKey="events"
            size="large"
            items={[
              {
                key: "events",
                label: "Recent Events",
                children: (
                  <MatchEventTimeline
                    matchId={match.id}
                    homeTeamId={match.homeTeamId}
                    awayTeamId={match.awayTeamId}
                    matchDurationMinutes={match.matchDurationMinutes}
                    elapsedTimeSeconds={match.elapsedTimeSeconds}
                    startedAt={match.startedAt}
                    completedAt={match.completedAt}
                  />
                ),
              },
              {
                key: "record",
                label: "Record Events",
                children: (
                  <QuickEventRecorder
                    matchId={match.id}
                    fixture={match}
                    homeTeamPlayers={teamPlayersMap[match.homeTeamId] || []}
                    awayTeamPlayers={teamPlayersMap[match.awayTeamId] || []}
                    onSuccess={handleModalRefresh}
                  />
                ),
              },
              {
                key: "statistics",
                label: "Statistics",
                children: <MatchStatistics matchId={match.id} />,
              },
              {
                key: "countdown",
                label: "Timer",
                children: <MatchCountdown fixture={match} />,
              },
            ]}
          />
        </div>
      </Spin>
    </Modal>
  );
}
