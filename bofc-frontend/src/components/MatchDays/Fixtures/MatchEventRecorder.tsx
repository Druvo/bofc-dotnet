import React, { useState, useMemo } from "react";
import {
  Card,
  Form,
  Select,
  Button,
  InputNumber,
  message,
  List,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Modal,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import moment from "moment";
import { IFixture, IMatchEvent } from "../../../state/features/fixtures/fixtureTypes";
import {
  useRecordMatchEventMutation,
  useDeleteMatchEventMutation,
  useGetMatchEventsQuery,
} from "../../../state/features/fixtures/fixturesSlice";

const { Text } = Typography;

interface MatchEventRecorderProps {
  matchId: number;
  fixture: IFixture | null;
  homeTeamPlayers?: Array<{ id: number; name: string }>;
  awayTeamPlayers?: Array<{ id: number; name: string }>;
  onSuccess?: () => void;
  readOnlyMode?: boolean;
}

export default function MatchEventRecorder({ 
  matchId, 
  fixture,
  homeTeamPlayers = [],
  awayTeamPlayers = [],
  onSuccess,
  readOnlyMode = false,
}: MatchEventRecorderProps) {
  const [form] = Form.useForm();
  const [recordEvent, { isLoading: isRecording }] = useRecordMatchEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteMatchEventMutation();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [manualEventMinute, setManualEventMinute] = useState<number | null>(null);
  
  // Get match events
  const { 
    data: eventsData, 
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useGetMatchEventsQuery({ matchId });

  const events = eventsData?.content || [];

  // Get current team's players based on selected team
  const currentTeamPlayers = useMemo(() => {
    if (!selectedTeamId || !fixture) return [];
    
    if (selectedTeamId === fixture.homeTeamId) {
      return homeTeamPlayers;
    } else if (selectedTeamId === fixture.awayTeamId) {
      return awayTeamPlayers;
    }
    
    return [];
  }, [selectedTeamId, fixture, homeTeamPlayers, awayTeamPlayers]);

  // Calculate current elapsed time
  const calculateElapsedTime = (): number => {
    if (!fixture) return 0;

    if (fixture.matchStatus === "ONGOING" && fixture.startedAt) {
      const startTime = moment.utc(fixture.startedAt).local().valueOf();
      const now = Date.now();
      const timeSinceStart = Math.floor((now - startTime) / 1000);
      const totalElapsed = (fixture.elapsedTimeSeconds || 0) + timeSinceStart;
      return Math.floor(totalElapsed / 60); // Return minutes
    } else if (fixture.matchStatus === "PAUSED" || fixture.matchStatus === "COMPLETED") {
      return Math.floor((fixture.elapsedTimeSeconds || 0) / 60); // Return minutes
    }
    
    return 0;
  };

  const handleRecordEvent = async (values: any) => {
    try {
      const currentMinute = calculateElapsedTime();
      const resolvedMinute =
        manualEventMinute == null
          ? currentMinute
          : Math.max(0, Math.min(150, Math.floor(manualEventMinute)));

      await recordEvent({
        matchId,
        eventType: values.eventType,
        playerId: values.playerId,
        teamId: values.teamId,
        eventTime: resolvedMinute,
        details: values.details,
      }).unwrap();

      message.success("Event recorded successfully");
      form.resetFields();
      setSelectedTeamId(null);
      setManualEventMinute(null);
      refetchEvents();
      onSuccess?.(); // Call onSuccess callback if provided
    } catch (error: any) {
      console.error("Failed to record event:", error);
      message.error(error?.data?.message || "Failed to record event");
    }
  };

  const handleDeleteEvent = (eventId: number) => {
    Modal.confirm({
      title: "Delete Event",
      content: "Are you sure you want to delete this event?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteEvent({ matchId, eventId }).unwrap();
          message.success("Event deleted successfully");
          refetchEvents();
          onSuccess?.(); // Call onSuccess callback if provided
        } catch (error: any) {
          console.error("Delete event error:", error);
          // Handle different error statuses - safely extract error message
          let errorMessage = "Failed to delete event";
          
          try {
            // RTK Query error structure: error.data or error.error
            const errorData = error?.data || error?.error || error;
            
            // Check status code
            const status = error?.status || errorData?.statusCode || errorData?.status;
            
            if (status === 409 || status === "CONFLICT") {
              errorMessage = errorData?.message || 
                            errorData?.detail || 
                            errorData?.error || 
                            "Cannot delete events from completed matches. The match has already been completed.";
            } else if (status === 404 || status === "NOT_FOUND") {
              errorMessage = errorData?.message || 
                            errorData?.detail || 
                            "Event not found. It may have already been deleted.";
            } else {
              // Try to extract message from various possible locations
              errorMessage = errorData?.message || 
                           errorData?.detail || 
                           errorData?.error || 
                           error?.message || 
                           (typeof errorData === 'string' ? errorData : "Failed to delete event");
            }
          } catch (parseError) {
            // If error parsing fails, use a safe default message
            console.error("Error parsing error object:", parseError);
            errorMessage = "Failed to delete event. The match may have been completed.";
          }
          
          message.error(errorMessage);
        }
      },
    });
  };

  const handleTeamChange = (teamId: number) => {
    setSelectedTeamId(teamId);
    // Reset player field when team changes
    form.setFieldsValue({ playerId: undefined });
  };

  if (!fixture) {
    return (
      <Card>
        <Text type="secondary">No fixture data available</Text>
      </Card>
    );
  }

  return (
    <Card 
      title="Match Events" 
      extra={
        <Text type="secondary">
          Current Time: {calculateElapsedTime()}'
        </Text>
      }
    >
      {!readOnlyMode && (
        <>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRecordEvent}
          >
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="eventType"
                  label="Event Type"
                  rules={[{ required: true, message: "Select event" }]}
                  style={{ marginBottom: 8 }}
                >
                  <Select placeholder="Select event type" size="large">
                    <Select.Option value="GOAL">⚽ Goal</Select.Option>
                    <Select.Option value="ASSIST">🎯 Assist</Select.Option>
                    <Select.Option value="YELLOW_CARD">🟨 Yellow Card</Select.Option>
                    <Select.Option value="RED_CARD">🟥 Red Card</Select.Option>
                    <Select.Option value="SUBSTITUTION">🔄 Substitution</Select.Option>
                    <Select.Option value="INJURY">🤕 Injury</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="teamId"
                  label="Team"
                  rules={[{ required: true, message: "Select team" }]}
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    placeholder="Select team"
                    size="large"
                    onChange={handleTeamChange}
                  >
                    <Select.Option value={fixture.homeTeamId}>
                      {fixture.homeTeamName}
                    </Select.Option>
                    <Select.Option value={fixture.awayTeamId}>
                      {fixture.awayTeamName}
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="playerId"
                  label="Player"
                  rules={[{ required: true, message: "Select player" }]}
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    placeholder="Select player"
                    size="large"
                    disabled={!selectedTeamId || currentTeamPlayers.length === 0}
                    showSearch
                    filterOption={(input, option) => {
                      const label = option?.label;
                      if (typeof label === 'string') {
                        return label.toLowerCase().includes(input.toLowerCase());
                      }
                      return false;
                    }}
                  >
                    {currentTeamPlayers.map((player: { id: number; name: string }) => (
                      <Select.Option key={player.id} value={player.id} label={player.name}>
                        {player.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Event Minute (Optional)" style={{ marginBottom: 8 }}>
                  <InputNumber
                    min={0}
                    max={150}
                    step={1}
                    size="large"
                    style={{ width: "100%" }}
                    value={manualEventMinute}
                    onChange={(value) => setManualEventMinute(typeof value === "number" ? value : null)}
                    placeholder={`Auto (${calculateElapsedTime()}')`}
                  />
                </Form.Item>
              </Col>

            </Row>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isRecording}
                block
                size="large"
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 48
                }}
              >
                📝 Record Event at {calculateElapsedTime()}'
              </Button>
            </Form.Item>
          </Form>
          <Divider />
        </>
      )}

      {/* Events List */}
      <List
        loading={isLoadingEvents}
        dataSource={events}
        locale={{ emptyText: "No events recorded yet" }}
        size="small"
        renderItem={(event: IMatchEvent) => (
          <List.Item
            style={{ padding: "12px 0" }}
            actions={
              !readOnlyMode ? [
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteEvent(event.id)}
                  loading={isDeleting}
                  style={{ borderRadius: 6 }}
                />,
              ] : []
            }
          >
            <List.Item.Meta
              avatar={
                <div style={{
                  fontSize: 28,
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                  borderRadius: 8
                }}>
                  {getEventIcon(event.eventType)}
                </div>
              }
              title={
                <Space size="small" wrap>
                  <Text strong style={{ fontSize: 14 }}>{event.eventType.replace('_', ' ')}</Text>
                  <Tag color="blue" style={{ margin: 0 }}>{event.eventTime}'</Tag>
                </Space>
              }
              description={
                <div style={{ fontSize: 13 }}>
                  <Text strong>{event.playerName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{event.teamName}</Text>
                  {event.description && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                        {event.description}
                      </Text>
                    </>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}

// Helper function to get event icon
function getEventIcon(eventType: string): string {
  switch (eventType) {
    case "GOAL":
      return "⚽";
    case "ASSIST":
      return "🎯";
    case "YELLOW_CARD":
      return "🟨";
    case "RED_CARD":
      return "🟥";
    case "SUBSTITUTION":
      return "🔄";
    case "INJURY":
      return "🤕";
    default:
      return "📝";
  }
}
