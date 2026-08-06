import React, { useState } from "react";
import {
  Card,
  Tag,
  Space,
  Button,
  Dropdown,
  Typography,
  Badge,
  Collapse,
  Empty,
} from "antd";
import {
  HolderOutlined,
  SettingOutlined,
  PlusOutlined,
  TeamOutlined,
  AppstoreOutlined,
  TrophyOutlined,
  MoreOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Droppable, Draggable } from "react-beautiful-dnd";
import {
  MatchDayRoundResponse,
  RoundType,
  RoundStatus,
} from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import GroupCard from "./GroupCard";
import GroupManagement from "../GroupManagement";
import { useDeleteRoundMutation } from "../../../../../state/features/manualFixtures/manualFixturesSlice";

const { Text } = Typography;
const { Panel } = Collapse;

interface RoundCardProps {
  round: MatchDayRoundResponse;
  matchDayId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  dragHandleProps: any;
  onEdit: () => void;
  onRefresh: () => void;
}

const getStatusColor = (status: RoundStatus) => {
  switch (status) {
    case RoundStatus.NOT_STARTED:
      return "gold";
    case RoundStatus.ONGOING:
      return "orange";
    case RoundStatus.COMPLETED:
      return "green";
    default:
      return "default";
  }
};

const getRoundTypeIcon = (type: RoundType) => {
  return type === RoundType.GROUP_BASED ? (
    <AppstoreOutlined />
  ) : (
    <TrophyOutlined />
  );
};

export default function RoundCard({
  round,
  matchDayId,
  teams,
  dragHandleProps,
  onEdit,
  onRefresh,
}: RoundCardProps) {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [deleteRound, { isLoading: isDeleting }] = useDeleteRoundMutation();

  const handleDeleteRound = async () => {
    if (window.confirm(`Are you sure you want to delete round "${round.roundName}"?`)) {
      try {
        await deleteRound({ roundId: round.id }).unwrap();
        onRefresh();
      } catch (error) {
        console.error("Failed to delete round:", error);
      }
    }
  };

  const handleCreateGroup = () => {
    setSelectedGroupId(null);
    setShowGroupModal(true);
  };

  const menuItems = [
    {
      key: "settings",
      label: "Round Settings",
      icon: <SettingOutlined />,
      onClick: onEdit,
    },
    {
      key: "delete",
      label: "Delete Round",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDeleteRound,
    },
  ];

  return (
    <>
      <Badge.Ribbon
        text={round.roundType}
        color={round.roundType === RoundType.GROUP_BASED ? "blue" : "purple"}
      >
        <Card
          style={{
            border: "2px solid #e8e8e8",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Round Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Space size={12}>
              <div {...dragHandleProps} style={{ cursor: "grab" }}>
                <HolderOutlined style={{ fontSize: 20, color: "#999" }} />
              </div>
              <div>
                <Space size={8}>
                  {getRoundTypeIcon(round.roundType)}
                  <Text strong style={{ fontSize: 16 }}>
                    {round.roundName}
                  </Text>
                  <Tag color={getStatusColor(round.status)}>{round.status}</Tag>
                </Space>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Order: {round.sequenceOrder} • Groups: {round.groups?.length || 0} •
                    Matches: {round.totalMatches}
                  </Text>
                </div>
              </div>
            </Space>

            <Space>
              {round.roundType === RoundType.GROUP_BASED && (
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleCreateGroup}
                >
                  Add Group
                </Button>
              )}
              <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                <Button size="small" icon={<MoreOutlined />} aria-label="More actions" />
              </Dropdown>
            </Space>
          </div>

          {/* Groups Section - Drag and Drop */}
          {round.roundType === RoundType.GROUP_BASED ? (
            !round.groups || round.groups.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No groups yet. Add a group to get started."
                style={{ padding: "24px 0" }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateGroup}
                >
                  Add Group
                </Button>
              </Empty>
            ) : (
              <Droppable droppableId={`round-${round.id}-groups`} type="GROUP">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      background: snapshot.isDraggingOver ? "#fafafa" : "#f5f5f5",
                      padding: 16,
                      borderRadius: 8,
                      minHeight: 100,
                    }}
                  >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {[...(round.groups || [])]
                        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                        .map((group: any, index: number) => (
                          <Draggable
                            key={group.id}
                            draggableId={`group-${group.id}`}
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
                                <GroupCard
                                  group={group}
                                  roundId={round.id}
                                  teams={teams}
                                  dragHandleProps={provided.dragHandleProps}
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
            )
          ) : (
            <div
              style={{
                background: "#f5f5f5",
                padding: 16,
                borderRadius: 8,
              }}
            >
              <Text type="secondary">
                <TeamOutlined /> Direct Knockout Round - Teams will be managed
                automatically based on previous round results
              </Text>
            </div>
          )}
        </Card>
      </Badge.Ribbon>

      {/* Group Management Modal */}
      <GroupManagement
        roundId={round.id}
        groupId={selectedGroupId}
        isModalVisible={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setSelectedGroupId(null);
        }}
        onSuccess={onRefresh}
      />
    </>
  );
}
