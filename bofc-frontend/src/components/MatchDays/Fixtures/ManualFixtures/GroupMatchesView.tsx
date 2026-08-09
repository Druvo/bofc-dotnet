import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Empty,
  Spin,
  Badge,
  Popconfirm,
  message,
} from "antd";
import {
  PlayCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  useGetGroupMatchesQuery,
  useClearGroupMatchesMutation,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { IMatch } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { useNavigate } from "react-router-dom";
import VenueLink from "../../../CommonAtoms/VenueLink";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface GroupMatchesViewProps {
  groupId: number | null;
  groupName: string | null;
}

const getMatchStatusColor = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "gold";
    case "ONGOING":
      return "green";
    case "PAUSED":
      return "orange";
    case "COMPLETED":
      return "default";
    default:
      return "default";
  }
};

const getMatchStatusIcon = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return <CalendarOutlined />;
    case "ONGOING":
      return <PlayCircleOutlined />;
    case "COMPLETED":
      return <TrophyOutlined />;
    default:
      return null;
  }
};

export default function GroupMatchesView({
  groupId,
  groupName,
}: GroupMatchesViewProps) {
  const navigate = useNavigate();
  const [clearMatches, { isLoading: isClearing }] = useClearGroupMatchesMutation();

  const {
    data: matchesData,
    isLoading,
    isFetching,
    refetch,
  } = useGetGroupMatchesQuery(
    { groupId: groupId! },
    {
      skip: !groupId,
      pollingInterval: 30000, // Refresh every 30 seconds
    }
  );

  const matches = matchesData?.content || [];

  const handleClearMatches = async () => {
    if (!groupId) return;

    try {
      await clearMatches({ groupId }).unwrap();
      message.success("All matches cleared successfully");
      refetch();
    } catch (error: any) {
      console.error("Failed to clear matches:", error);
      // Error notification is handled by API slice
    }
  };

  const columns = [
    {
      title: "#",
      dataIndex: "matchOrder",
      key: "matchOrder",
      width: 60,
      align: "center" as const,
      render: (order: number) => (
        <Text strong style={{ fontSize: 16 }}>
          {order}
        </Text>
      ),
    },
    {
      title: "Match",
      key: "match",
      render: (record: IMatch) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong style={{ fontSize: 14 }}>
              {record.homeTeamName}
            </Text>
            {record.matchStatus === "COMPLETED" && (
              <Badge
                count={record.homeTeamScore}
                style={{
                  backgroundColor:
                    record.homeTeamScore > record.awayTeamScore
                      ? "#52c41a"
                      : "#d9d9d9",
                }}
              />
            )}
          </Space>
          <Space>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {record.awayTeamName}
            </Text>
            {record.matchStatus === "COMPLETED" && (
              <Badge
                count={record.awayTeamScore}
                style={{
                  backgroundColor:
                    record.awayTeamScore > record.homeTeamScore
                      ? "#52c41a"
                      : "#d9d9d9",
                }}
              />
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: "Score",
      key: "score",
      width: 100,
      align: "center" as const,
      render: (record: IMatch) => {
        if (record.matchStatus === "SCHEDULED") {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Text strong style={{ fontSize: 16 }}>
            {record.homeTeamScore} - {record.awayTeamScore}
          </Text>
        );
      },
    },
    {
      title: "Date & Time",
      dataIndex: "matchDate",
      key: "matchDate",
      render: (date: string, record: { matchDurationMinutes?: number | null }) => {
        const start = dayjs(date);
        const end = start.add(record.matchDurationMinutes || 90, "minutes");
        const sameDay = start.isSame(end, "day");
        return (
          <Space direction="vertical" size={0}>
            <Text>{start.format("MMM DD, YYYY")}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {start.format("hh:mm A")} – {end.format(sameDay ? "hh:mm A" : "MMM DD, YYYY hh:mm A")}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Venue",
      dataIndex: "venueName",
      key: "venueName",
      render: (venue: string | null, record: { venueMapLink?: string | null }) =>
        venue ? (
          <VenueLink name={venue} mapLink={record.venueMapLink} className="hover:underline" />
        ) : (
          <Text type="secondary">TBD</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "matchStatus",
      key: "matchStatus",
      width: 130,
      render: (status: string) => (
        <Tag color={getMatchStatusColor(status)} icon={getMatchStatusIcon(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center" as const,
      render: (record: IMatch) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/fixtures/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const getMatchStats = () => {
    const total = matches.length;
    const scheduled = matches.filter((m) => m.matchStatus === "SCHEDULED").length;
    const ongoing = matches.filter((m) => m.matchStatus === "ONGOING").length;
    const completed = matches.filter((m) => m.matchStatus === "COMPLETED").length;

    return { total, scheduled, ongoing, completed };
  };

  const stats = getMatchStats();

  if (!groupId) {
    return (
      <Card>
        <Empty description="Please select a group to view matches" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined style={{ color: "#c6a15b" }} />
          <span>Matches in {groupName || "Group"}</span>
        </Space>
      }
      extra={
        <Space>
          {matches.length > 0 && (
            <Popconfirm
              title="Clear all matches?"
              description="This will delete all matches in this group. This action cannot be undone."
              onConfirm={handleClearMatches}
              okText="Yes, Clear All"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isClearing }}
            >
              <Button danger icon={<DeleteOutlined />} loading={isClearing}>
                Clear Matches
              </Button>
            </Popconfirm>
          )}
          <Button onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        </Space>
      }
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" tip="Loading matches..." />
        </div>
      ) : matches.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical">
              <Text>No matches generated yet</Text>
              <Text type="secondary">
                Click "Generate Matches" to create round-robin fixtures
              </Text>
            </Space>
          }
        />
      ) : (
        <>
          <Space style={{ marginBottom: 16, width: "100%" }} wrap>
            <Badge count={stats.total} showZero color="#123524">
              <Tag>Total Matches</Tag>
            </Badge>
            <Badge count={stats.scheduled} showZero color="gold">
              <Tag>Scheduled</Tag>
            </Badge>
            <Badge count={stats.ongoing} showZero color="green">
              <Tag>Ongoing</Tag>
            </Badge>
            <Badge count={stats.completed} showZero color="default">
              <Tag>Completed</Tag>
            </Badge>
          </Space>

          <Table
            columns={columns}
            dataSource={matches}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
            size="middle"
          />
        </>
      )}
    </Card>
  );
}
