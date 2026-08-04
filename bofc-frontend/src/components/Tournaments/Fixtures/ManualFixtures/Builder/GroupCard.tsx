import React, { useState } from "react";
import {
  Card,
  Tag,
  Space,
  Button,
  Dropdown,
  Typography,
  Modal,
  Empty,
  Popover,
  Badge,
} from "antd";
import {
  HolderOutlined,
  SettingOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  MoreOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { RoundGroupResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import TeamAssignment from "../TeamAssignment";
import GroupManagement from "../GroupManagement";
import {
  useDeleteGroupMutation,
} from "../../../../../state/features/manualFixtures/manualFixturesSlice";

const { Text } = Typography;

interface GroupCardProps {
  group: RoundGroupResponse;
  roundId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  dragHandleProps: any;
  onRefresh: () => void;
}

export default function GroupCard({
  group,
  roundId,
  teams,
  dragHandleProps,
  onRefresh,
}: GroupCardProps) {
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();

  const handleDeleteGroup = async () => {
    if (window.confirm(`Are you sure you want to delete group "${group.groupName}"?`)) {
      try {
        await deleteGroup({ groupId: group.id }).unwrap();
        onRefresh();
      } catch (error) {
        console.error("Failed to delete group:", error);
      }
    }
  };

  const menuItems = [
    {
      key: "settings",
      label: "Group Settings",
      icon: <SettingOutlined />,
      onClick: () => setShowEditModal(true),
    },
    {
      key: "teams",
      label: "Manage Teams",
      icon: <TeamOutlined />,
      onClick: () => setShowTeamModal(true),
    },
    {
      key: "delete",
      label: "Delete Group",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDeleteGroup,
    },
  ];

  const isPlaceholder = (teamName: string) => {
    return (
      teamName.includes("TBD") ||
      teamName.includes("Winner") ||
      teamName.includes("Runner-up")
    );
  };

  return (
    <>
      <Card
        size="small"
        style={{
          background: "#fff",
          border: "1px solid #d9d9d9",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: group.teams.length > 0 ? 12 : 0,
          }}
        >
          <Space size={8}>
            <div {...dragHandleProps} style={{ cursor: "grab" }}>
              <HolderOutlined style={{ fontSize: 16, color: "#999" }} />
            </div>
            <Text strong>{group.groupName}</Text>
            <Badge count={group.teams.length} showZero color="#123524" />
          </Space>

          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setShowTeamModal(true)}
            >
              Add Team
            </Button>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" size="small" icon={<MoreOutlined />} aria-label="More actions" />
            </Dropdown>
          </Space>
        </div>

        {/* Teams Section - Drag and Drop */}
        {group.teams.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">No teams assigned</Text>}
            style={{ padding: "12px 0", margin: 0 }}
          />
        ) : (
          <Droppable droppableId={`group-${group.id}-teams`} type="TEAM">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  background: snapshot.isDraggingOver ? "#e6f7ff" : "transparent",
                  padding: snapshot.isDraggingOver ? 8 : 0,
                  borderRadius: 4,
                  minHeight: 40,
                }}
              >
                <Space
                  direction="vertical"
                  size={6}
                  style={{ width: "100%", display: "flex" }}
                >
                  {[...(group.teams || [])]
                    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                    .map((team: any, index: number) => {
                      const isPlaceholderTeam = isPlaceholder(team.teamName);
                      return (
                        <Draggable
                          key={team.id}
                          draggableId={`team-${team.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                padding: "6px 12px",
                                background: isPlaceholderTeam
                                  ? "#fff7e6"
                                  : "#f0f0f0",
                                border: isPlaceholderTeam
                                  ? "1px dashed #faad14"
                                  : "1px solid #d9d9d9",
                                borderRadius: 4,
                                cursor: "move",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <Space size={8}>
                                <Tag
                                  style={{
                                    minWidth: 24,
                                    textAlign: "center",
                                    margin: 0,
                                  }}
                                >
                                  {team.position}
                                </Tag>
                                {isPlaceholderTeam ? (
                                  <QuestionCircleOutlined
                                    style={{ color: "#faad14" }}
                                  />
                                ) : (
                                  <UserOutlined />
                                )}
                                <Text
                                  style={{
                                    fontStyle: isPlaceholderTeam ? "italic" : "normal",
                                  }}
                                >
                                  {team.teamName}
                                </Text>
                              </Space>
                              {team.points !== undefined && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {team.points} pts
                                </Text>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                </Space>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </Card>

      {/* Team Assignment Modal */}
      <TeamAssignment
        groupId={group.id}
        roundId={roundId}
        teams={teams}
        isModalVisible={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSuccess={() => {
          onRefresh();
          setShowTeamModal(false);
        }}
      />

      {/* Group Edit Modal */}
      <GroupManagement
        roundId={roundId}
        groupId={group.id}
        isModalVisible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={onRefresh}
      />
    </>
  );
}
