import React from "react";
import { Card, Empty, Typography, Row, Col, Statistic, Space } from "antd";
import {
  TrophyOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { TournamentStructureResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import TournamentFlowVisualization from "../TournamentFlowVisualization";

const { Title, Text } = Typography;

interface PreviewTabProps {
  tournamentStructure?: TournamentStructureResponse;
  teams: Array<{ teamId: number; teamName: string }>;
  isLoading: boolean;
}

export default function PreviewTab({
  tournamentStructure,
  teams,
  isLoading,
}: PreviewTabProps) {
  if (!tournamentStructure) {
    return (
      <Card style={{ margin: 24 }}>
        <Empty
          description={
            <div>
              <Text type="secondary">
                No tournament structure to visualize yet.
              </Text>
              <br />
              <Text type="secondary">
                Create rounds in the Tournament tab to see the flow visualization.
              </Text>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Tournament Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <TrophyOutlined style={{ fontSize: 24, color: "#c6a15b" }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {tournamentStructure.tournamentName}
                </Title>
                <Text type="secondary">
                  {tournamentStructure.totalRounds} Rounds • {tournamentStructure.totalMatches} Matches
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Rounds"
              value={tournamentStructure.totalRounds}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Matches"
              value={tournamentStructure.totalMatches}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Completed"
              value={tournamentStructure.completedMatches}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Available Teams"
              value={teams.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Visualization */}
      {tournamentStructure.rounds.length > 0 ? (
        <Card style={{ height: 600 }}>
          <TournamentFlowVisualization tournamentStructure={tournamentStructure} />
        </Card>
      ) : (
        <Card>
          <Empty
            description={
              <Text type="secondary">
                No rounds created yet. Create rounds in the Tournament tab.
              </Text>
            }
          />
        </Card>
      )}
    </div>
  );
}
