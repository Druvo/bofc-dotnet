import { useState, useCallback } from "react";
import { Card, Row, Col, List, Button, Space, Typography, Tag, Empty, Tooltip, Modal } from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  TrophyOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { toast } from "react-toastify";
import PlaceholderTeamModal from "./PlaceholderTeamModal";
import { TeamInGroupResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";

const { Text, Title } = Typography;

interface DirectKnockoutTeamManagementProps {
  roundId: number;
  roundName: string;
  teams: TeamInGroupResponse[];
  availableTeams: Array<{ teamId: number; teamName: string }>;
  maxTeams?: number;
  onAssignTeams: (teamIds: number[]) => Promise<void>;
  onRemoveTeam: (teamId: number) => Promise<void>;
  onRefresh: () => void;
}

/**
 * DirectKnockoutTeamManagement - Manage teams in DIRECT_KNOCKOUT rounds
 *
 * Features:
 * - Drag-and-drop team assignment with seed positions
 * - Create placeholder teams for TBD slots
 * - Visual seed ordering
 * - Batch team assignment
 */
export default function DirectKnockoutTeamManagement({
  roundId,
  roundName,
  teams,
  availableTeams,
  maxTeams = 16,
  onAssignTeams,
  onRemoveTeam,
  onRefresh,
}: DirectKnockoutTeamManagementProps) {
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [isPlaceholderModalVisible, setIsPlaceholderModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out already assigned teams
  const unassignedTeams = availableTeams.filter(
    (t) => !teams.some((at) => at.teamId === t.teamId)
  );

  const handleSelectTeam = (teamId: number) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleAssignSelected = async () => {
    if (selectedTeams.length === 0) {
      toast.warning("Please select at least one team");
      return;
    }

    if (teams.length + selectedTeams.length > maxTeams) {
      toast.error(`Cannot exceed maximum of ${maxTeams} teams`);
      return;
    }

    try {
      setIsLoading(true);
      await onAssignTeams(selectedTeams);
      setSelectedTeams([]);
      toast.success(`Assigned ${selectedTeams.length} team(s) successfully`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to assign teams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeam = async (teamId: number) => {
    Modal.confirm({
      title: "Remove Team?",
      content: "Are you sure you want to remove this team from the round?",
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          await onRemoveTeam(teamId);
          toast.success("Team removed successfully");
        } catch (error: any) {
          toast.error(error?.message || "Failed to remove team");
        }
      },
    });
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;

      if (sourceIndex === destIndex) return;

      // TODO: Implement seed position reordering
      // This would require a backend API to update seed positions
      toast.info("Seed reordering - Coming soon! (Requires backend API)");
    },
    []
  );

  const getSeedPosition = (index: number) => {
    return index + 1;
  };

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <span>{roundName} - Team Management</span>
        </Space>
      }
      extra={
        <Space>
          <Tag color="blue">{teams.length} / {maxTeams} Teams</Tag>
          <Tooltip title="Create placeholder for teams to be determined later">
            <Button
              type="dashed"
              icon={<InfoCircleOutlined />}
              onClick={() => setIsPlaceholderModalVisible(true)}
            >
              Add Placeholder
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        {/* Available Teams */}
        <Col xs={24} lg={12}>
          <Card
            type="inner"
            title={
              <Space>
                <UserAddOutlined />
                <span>Available Teams ({unassignedTeams.length})</span>
              </Space>
            }
            size="small"
          >
            {unassignedTeams.length === 0 ? (
              <Empty description="No teams available" />
            ) : (
              <>
                <List
                  size="small"
                  dataSource={unassignedTeams}
                  style={{ maxHeight: 400, overflowY: "auto" }}
                  renderItem={(team) => (
                    <List.Item
                      key={team.teamId}
                      style={{
                        cursor: "pointer",
                        backgroundColor: selectedTeams.includes(team.teamId)
                          ? "rgba(198, 161, 91, 0.14)"
                          : "transparent",
                        border: selectedTeams.includes(team.teamId)
                          ? "1px solid #c6a15b"
                          : "1px solid transparent",
                        borderRadius: 4,
                        marginBottom: 4,
                        padding: "8px 12px",
                      }}
                      onClick={() => handleSelectTeam(team.teamId)}
                    >
                      <Space>
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.teamId)}
                          onChange={() => handleSelectTeam(team.teamId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Text strong>{team.teamName}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={handleAssignSelected}
                    disabled={selectedTeams.length === 0 || teams.length >= maxTeams}
                    loading={isLoading}
                    block
                  >
                    Assign {selectedTeams.length > 0 && `(${selectedTeams.length})`} Team(s)
                  </Button>
                </div>
              </>
            )}
          </Card>
        </Col>

        {/* Assigned Teams with Seeds */}
        <Col xs={24} lg={12}>
          <Card
            type="inner"
            title={
              <Space>
                <TrophyOutlined />
                <span>Seeded Teams ({teams.length})</span>
              </Space>
            }
            extra={
              teams.length > 0 && (
                <Tooltip title="Drag to reorder seeds">
                  <SwapOutlined />
                </Tooltip>
              )
            }
            size="small"
          >
            {teams.length === 0 ? (
              <Empty description="No teams assigned yet" />
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="knockout-teams">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        maxHeight: 400,
                        overflowY: "auto",
                        backgroundColor: snapshot.isDraggingOver ? "#f0f5ff" : "transparent",
                        borderRadius: 4,
                        padding: 4,
                      }}
                    >
                      {teams.map((team, index) => (
                        <Draggable
                          key={team.id || `team-${index}`}
                          draggableId={`team-${team.id || index}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                marginBottom: 8,
                                backgroundColor: snapshot.isDragging ? "rgba(198, 161, 91, 0.14)" : "#fafafa",
                                border: snapshot.isDragging
                                  ? "2px dashed #c6a15b"
                                  : "1px solid #d9d9d9",
                                borderRadius: 4,
                                padding: "12px 16px",
                              }}
                            >
                              <Row align="middle" justify="space-between">
                                <Col>
                                  <Space>
                                    <Tag color="blue">Seed {getSeedPosition(index)}</Tag>
                                    {team.isPlaceholder ? (
                                      <>
                                        <Tag color="orange">TBD</Tag>
                                        <Text type="secondary" italic>
                                          {team.placeholderName || "To Be Determined"}
                                        </Text>
                                      </>
                                    ) : (
                                      <Text strong>{team.teamName}</Text>
                                    )}
                                  </Space>
                                </Col>
                                <Col>
                                  {team.teamId && (
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleRemoveTeam(team.teamId!)}
                                    />
                                  )}
                                </Col>
                              </Row>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </Card>
        </Col>
      </Row>

      {/* Info Section */}
      <Card
        type="inner"
        size="small"
        style={{ marginTop: 16, backgroundColor: "#f0f5ff", border: "1px solid #adc6ff" }}
      >
        <Space direction="vertical" size={4}>
          <Text strong>
            <InfoCircleOutlined /> How to use:
          </Text>
          <Text type="secondary">• Select teams from the left and click "Assign" to add them</Text>
          <Text type="secondary">• Drag assigned teams to reorder their seed positions</Text>
          <Text type="secondary">• Use "Add Placeholder" for teams determined by match results</Text>
          <Text type="secondary">• Seeds determine match pairings (e.g., Seed 1 vs Seed 16)</Text>
        </Space>
      </Card>

      {/* Placeholder Modal */}
      <PlaceholderTeamModal
        visible={isPlaceholderModalVisible}
        onClose={() => {
          setIsPlaceholderModalVisible(false);
          onRefresh();
        }}
        roundId={roundId}
      />
    </Card>
  );
}
