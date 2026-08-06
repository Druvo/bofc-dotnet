import React from "react";
import {
  Card,
  Table,
  Empty,
  Tabs,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
} from "antd";
import {
  useGetMatchStatisticsQuery,
  useGetMatchEventsQuery,
} from "../../../state/features/fixtures/fixturesSlice";
import { MatchEventType } from "../../../state/features/fixtures/fixtureTypes";

interface MatchStatisticsProps {
  matchId: number;
}

const EVENT_COLORS: Record<string, string> = {
  GOAL: "gold",
  ASSIST: "blue",
  RED_CARD: "red",
  YELLOW_CARD: "orange",
  SUBSTITUTION: "purple",
  INJURY: "volcano",
};

export default function MatchStatistics({ matchId }: MatchStatisticsProps) {
  const { data: statsData, isLoading: statsLoading } =
    useGetMatchStatisticsQuery({
      matchId,
    });
  const { data: eventsData, isLoading: eventsLoading } =
    useGetMatchEventsQuery({
      matchId,
    });

  const statistics = statsData?.content || [];
  const events = eventsData?.content || [];

  const statsColumns = [
    {
      title: "Player",
      dataIndex: "playerName",
      key: "playerName",
      sorter: (a: any, b: any) =>
        a.playerName.localeCompare(b.playerName),
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      render: (team: string) => <Tag>{team}</Tag>,
    },
    {
      title: "Goals",
      dataIndex: "goalsScored",
      key: "goalsScored",
      sorter: (a: any, b: any) => b.goalsScored - a.goalsScored,
      render: (goals: number) => (
        <span style={{ color: "#faad14", fontWeight: "bold" }}>{goals}</span>
      ),
    },
    {
      title: "Assists",
      dataIndex: "assists",
      key: "assists",
      sorter: (a: any, b: any) => b.assists - a.assists,
    },
    {
      title: "Yellow Cards",
      dataIndex: "yellowCards",
      key: "yellowCards",
      sorter: (a: any, b: any) => b.yellowCards - a.yellowCards,
      render: (cards: number) =>
        cards > 0 ? (
          <Tag color="orange">{cards}</Tag>
        ) : (
          <span>-</span>
        ),
    },
    {
      title: "Red Cards",
      dataIndex: "redCards",
      key: "redCards",
      sorter: (a: any, b: any) => b.redCards - a.redCards,
      render: (cards: number) =>
        cards > 0 ? (
          <Tag color="red">{cards}</Tag>
        ) : (
          <span>-</span>
        ),
    },
  ];

  const eventColumns = [
    {
      title: "Time",
      dataIndex: "eventTime",
      key: "eventTime",
      width: 80,
      render: (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}'${seconds > 0 ? seconds : ""}`;
      },
      sorter: (a: any, b: any) => a.eventTime - b.eventTime,
    },
    {
      title: "Event",
      dataIndex: "eventType",
      key: "eventType",
      render: (type: string) => (
        <Tag color={EVENT_COLORS[type] || "default"}>{type}</Tag>
      ),
    },
    {
      title: "Player",
      dataIndex: "playerName",
      key: "playerName",
      sorter: (a: any, b: any) =>
        a.playerName.localeCompare(b.playerName),
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      render: (team: string) => <Tag>{team}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => desc || "-",
    },
  ];

  return (
    <Card>
      <Tabs
        defaultActiveKey="statistics"
        items={[
          {
            key: "statistics",
            label: "Player Statistics",
            children: (
              <Spin spinning={statsLoading}>
                {statistics.length > 0 ? (
                  <Table
                    columns={statsColumns}
                    dataSource={statistics.map((stat) => ({
                      ...stat,
                      key: stat.playerId,
                    }))}
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                ) : (
                  <Empty description="No player statistics available" />
                )}
              </Spin>
            ),
          },
          {
            key: "events",
            label: "Match Events",
            children: (
              <Spin spinning={eventsLoading}>
                {events.length > 0 ? (
                  <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Goals"
                          value={events.filter(
                            (e) => e.eventType === MatchEventType.GOAL
                          ).length}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Assists"
                          value={events.filter(
                            (e) => e.eventType === MatchEventType.ASSIST
                          ).length}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Yellow Cards"
                          value={events.filter(
                            (e) => e.eventType === MatchEventType.YELLOW_CARD
                          ).length}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Red Cards"
                          value={events.filter(
                            (e) => e.eventType === MatchEventType.RED_CARD
                          ).length}
                        />
                      </Col>
                    </Row>

                    <Table
                      columns={eventColumns}
                      dataSource={events.map((event) => ({
                        ...event,
                        key: event.id,
                      }))}
                      pagination={{ pageSize: 15 }}
                      size="small"
                    />
                  </>
                ) : (
                  <Empty description="No match events recorded" />
                )}
              </Spin>
            ),
          },
        ]}
      />
    </Card>
  );
}
