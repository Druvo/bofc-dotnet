import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Empty,
  Typography,
  Row,
  Col,
  Statistic,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  TrophyOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TournamentStructureResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import RoundCard from "../Builder/RoundCard";
import RoundManagement from "../RoundManagement";

const { Title, Text, Paragraph } = Typography;

interface RoundBuilderTabProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  tournamentStructure?: TournamentStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function RoundBuilderTab({
  tournamentId,
  teams,
  tournamentStructure,
  isLoading,
  onRefresh,
}: RoundBuilderTabProps) {
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    // TODO: Implement round reordering API call
    message.info("Round reordering will be available soon");
  };

  const handleCreateRound = () => {
    setSelectedRoundId(null);
    setShowRoundModal(true);
  };

  const handleEditRound = (roundId: number) => {
    setSelectedRoundId(roundId);
    setShowRoundModal(true);
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Stats Section */}
      {tournamentStructure && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Rounds"
                value={tournamentStructure.totalRounds}
                prefix={<AppstoreOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Matches"
                value={tournamentStructure.totalMatches}
                prefix={<TrophyOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Completed Matches"
                value={tournamentStructure.completedMatches}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Available Teams"
                value={teams.length}
                prefix={<TeamOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={4} style={{ margin: 0 }}>
                Tournament Structure Builder
              </Title>
              <Text type="secondary">
                Drag and drop to organize rounds, groups, and teams
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRound}
                size="large"
              >
                Add Round
              </Button>
              <Button icon={<ReloadOutlined />} onClick={onRefresh} size="large">
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Rounds List - Drag and Drop */}
      {!tournamentStructure || tournamentStructure.rounds.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={12} style={{ textAlign: "center" }}>
                <Text strong style={{ fontSize: 16 }}>
                  No rounds created yet
                </Text>
                <Paragraph type="secondary" style={{ maxWidth: 500, margin: "0 auto" }}>
                  Get started by creating your first round. You can drag groups
                  into rounds to make them group-based, or drag teams directly for
                  knockout rounds. Set up placeholder teams for winners from
                  previous rounds.
                </Paragraph>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateRound}
                  size="large"
                >
                  Create Your First Round
                </Button>
              </Space>
            }
          />
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="rounds-list" type="ROUND">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  background: snapshot.isDraggingOver ? "#f0f2f5" : "transparent",
                  padding: snapshot.isDraggingOver ? 8 : 0,
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                }}
              >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {[...(tournamentStructure.rounds || [])]
                    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                    .map((round, index) => (
                      <Draggable
                        key={round.id}
                        draggableId={`round-${round.id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <RoundCard
                              round={round}
                              tournamentId={tournamentId}
                              teams={teams}
                              dragHandleProps={provided.dragHandleProps}
                              onEdit={() => handleEditRound(round.id)}
                              onRefresh={onRefresh}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                </Space>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Round Management Modal */}
      <RoundManagement
        tournamentId={tournamentId}
        roundId={selectedRoundId}
        isModalVisible={showRoundModal}
        onClose={() => {
          setShowRoundModal(false);
          setSelectedRoundId(null);
        }}
        onSuccess={onRefresh}
        existingRounds={tournamentStructure?.rounds || []}
      />
    </div>
  );
}
