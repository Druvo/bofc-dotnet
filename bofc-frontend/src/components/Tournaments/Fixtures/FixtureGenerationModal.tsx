import React, { useState, useMemo } from "react";
import {
  Modal,
  Form,
  Button,
  message,
  Space,
  Checkbox,
  DatePicker,
  InputNumber,
  Empty,
  Select,
  Spin,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Card,
  TimePicker,
  theme,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import moment, { Moment } from "moment";
import dayjs, { Dayjs } from "dayjs";
import { useGenerateFixturesMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { TournamentType } from "../../../state/features/fixtures/fixtureTypes";
import {
  calculateMatchCount,
  estimateTournamentDuration,
  validateSchedulingParameters,
  getTournamentTypeName,
  getTournamentTypeDescription,
} from "../../../utils/tournamentCalculations";

const { Title, Text } = Typography;

interface FixtureGenerationModalProps {
  tournamentId: number;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  teams: Array<{ teamId: number; teamName: string }>;
  onSuccess?: () => void;
  tournamentStartDate?: string; // Add tournament start date prop
}

export default function FixtureGenerationModal({
  tournamentId,
  isModalVisible,
  handleSetIsModalVisible,
  teams,
  onSuccess,
  tournamentStartDate,
}: FixtureGenerationModalProps) {
  const { token } = theme.useToken();
  const loginInfo = useSelector(selectLoginInfo);
  const [form] = Form.useForm();
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [matchDates, setMatchDates] = useState<string[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | undefined>();

  // Separate date and time states for new match - using Dayjs
  const [newMatchDate, setNewMatchDate] = useState<Dayjs | null>(null);
  const [newMatchTime, setNewMatchTime] = useState<Dayjs | null>(null);

  // New state variables for enhanced features
  const [timeGapMinutes, setTimeGapMinutes] = useState<number>(120);
  const [matchDurationMinutes, setMatchDurationMinutes] = useState<number>(90);
  const [tournamentType, setTournamentType] = useState<TournamentType>(
    TournamentType.ROUND_ROBIN
  );

  const [generateFixtures, { isLoading }] = useGenerateFixturesMutation();
  const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();

  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");

  // Calculate estimated match count based on tournament type
  const estimatedMatchCount = useMemo(() => {
    if (selectedTeams.length < 2) return 0;
    return calculateMatchCount(selectedTeams.length, tournamentType);
  }, [selectedTeams.length, tournamentType]);

  // Calculate estimated tournament duration
  const estimatedDuration = useMemo(() => {
    if (estimatedMatchCount === 0) return null;
    return estimateTournamentDuration(
      estimatedMatchCount,
      timeGapMinutes,
      matchDurationMinutes
    );
  }, [estimatedMatchCount, timeGapMinutes, matchDurationMinutes]);

  // Calculate estimated date range
  const estimatedDateRange = useMemo(() => {
    if (matchDates.length === 0 || !estimatedDuration) return null;
    const firstDate = dayjs(matchDates[0]);
    const lastDate = firstDate.add(estimatedDuration.totalMinutes, "minutes");
    return { firstDate, lastDate };
  }, [matchDates, estimatedDuration]);

  // Validate scheduling parameters
  const schedulingValidation = useMemo(() => {
    return validateSchedulingParameters(timeGapMinutes, matchDurationMinutes);
  }, [timeGapMinutes, matchDurationMinutes]);

  if (!isAdmin) {
    return null;
  }

  const handleTeamChange = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
    } else {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId));
    }
  };

  const handleAddMatchDate = () => {
    if (!newMatchDate || !newMatchTime) {
      message.warning("Please select both date and time");
      return;
    }

    const combinedDateTime = newMatchDate
      .hour(newMatchTime.hour())
      .minute(newMatchTime.minute())
      .second(0);

    setMatchDates([
      ...matchDates,
      combinedDateTime.format("YYYY-MM-DDTHH:mm:ss"),
    ]);
    setNewMatchDate(null);
    setNewMatchTime(null);
  };

  const handleRemoveMatchDate = (index: number) => {
    setMatchDates(matchDates.filter((_, i) => i !== index));
  };

  const handleMatchDateChange = (index: number, date: Moment | null) => {
    if (date) {
      const newDates = [...matchDates];
      newDates[index] = date.format("YYYY-MM-DDTHH:mm:ss");
      setMatchDates(newDates);
    }
  };

  const handleGenerate = async () => {
    if (selectedTeams.length < 2) {
      message.error("Select at least 2 teams");
      return;
    }

    if (matchDates.length === 0) {
      message.error("Add at least one match date");
      return;
    }

    // Show warning if scheduling parameters are invalid
    if (!schedulingValidation.isValid) {
      message.warning(schedulingValidation.warning);
      // Still allow generation but with warning
    }

    try {
      await generateFixtures({
        tournamentId,
        teamIds: selectedTeams,
        matchDates,
        timeGapMinutes,
        matchDurationMinutes,
        tournamentType,
        ...(selectedVenueId && { venueId: selectedVenueId }),
      }).unwrap();

      message.success(
        `Successfully generated ${estimatedMatchCount} fixtures!`
      );

      // Reset form
      setSelectedTeams([]);
      setMatchDates([]);
      setSelectedVenueId(undefined);
      setTimeGapMinutes(120);
      setMatchDurationMinutes(90);
      setTournamentType(TournamentType.ROUND_ROBIN);

      handleSetIsModalVisible(false);
      onSuccess?.();
    } catch (error) {
      message.error("Failed to generate fixtures");
    }
  };

  const handleCancel = () => {
    setSelectedTeams([]);
    setMatchDates([]);
    setSelectedVenueId(undefined);
    setTimeGapMinutes(120);
    setMatchDurationMinutes(90);
    setTournamentType(TournamentType.ROUND_ROBIN);
    handleSetIsModalVisible(false);
  };

  const minDate = tournamentStartDate ? dayjs(tournamentStartDate) : dayjs();

  const disabledDate = (current: Dayjs) => {
    return current && current < minDate.startOf("day");
  };

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            Generate Fixtures
          </span>
        </Space>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} size="large">
          Cancel
        </Button>,
        <Button
          key="generate"
          type="primary"
          loading={isLoading}
          onClick={handleGenerate}
          size="large"
          disabled={selectedTeams.length < 2 || matchDates.length === 0}
        >
          Generate {estimatedMatchCount} Fixtures
        </Button>,
      ]}
      width="min(95vw, 1200px)"
      style={{ top: 20 }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          padding: "8px 16px 16px",
        },
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Tournament Type & Venue Card */}
        <Card
          size="small"
          title={
            <Space>
              <TrophyOutlined />
              Tournament Configuration
            </Space>
          }
          style={{ borderRadius: 8 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Tournament Type" style={{ marginBottom: 0 }}>
                <Select
                  value={tournamentType}
                  onChange={setTournamentType}
                  size="large"
                  style={{ width: "100%" }}
                >
                  {[
                    TournamentType.ROUND_ROBIN,
                    TournamentType.DOUBLE_ROUND_ROBIN,
                    TournamentType.GROUP_STAGE,
                    TournamentType.KNOCKOUT,
                  ].map((type) => (
                    <Select.Option
                      key={type}
                      value={type}
                      label={getTournamentTypeName(type)}
                    >
                      <Tooltip
                        title={getTournamentTypeDescription(type)}
                        placement="right"
                      >
                        <div style={{ padding: "0px" }}>
                          <div style={{ fontWeight: 400 }}>
                            {getTournamentTypeName(type)}
                          </div>
                        </div>
                      </Tooltip>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Venue (Optional)" style={{ marginBottom: 0 }}>
                <Spin spinning={isVenuesLoading}>
                  <Select
                    placeholder="Select venue"
                    value={selectedVenueId}
                    onChange={setSelectedVenueId}
                    allowClear
                    size="large"
                    style={{ width: "100%" }}
                  >
                    {venuesData?.content?.map((venue: any) => (
                      <Select.Option key={venue.id} value={venue.id}>
                        <Tooltip
                          title={`${venue.name} - ${venue.address}`}
                          placement="right"
                        >
                          <div style={{ fontWeight: 500 }}>{venue.name}</div>
                        </Tooltip>
                      </Select.Option>
                    ))}
                  </Select>
                </Spin>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Team Selection Card */}
        <Card
          size="small"
          title={
            <Space>
              <span>Select Teams</span>
              {selectedTeams.length > 0 && (
                <Text type="success" style={{ fontSize: 12 }}>
                  ({selectedTeams.length} selected)
                </Text>
              )}
            </Space>
          }
          extra={
            selectedTeams.length < 2 && (
              <Text type="danger" style={{ fontSize: 12 }}>
                Minimum 2 teams required
              </Text>
            )
          }
          style={{ borderRadius: 8 }}
        >
          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              padding: "8px",
              background: token.colorBgLayout,
              borderRadius: 6,
            }}
          >
            {teams.length > 0 ? (
              <Row gutter={[8, 8]}>
                {teams.map((team) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={team.teamId}>
                    <Checkbox
                      checked={selectedTeams.includes(team.teamId)}
                      onChange={(e) =>
                        handleTeamChange(team.teamId, e.target.checked)
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: selectedTeams.includes(team.teamId)
                          ? token.colorPrimaryBg
                          : token.colorBgContainer,
                        border: `1px solid ${
                          selectedTeams.includes(team.teamId)
                            ? token.colorPrimaryBorder
                            : token.colorBorder
                        }`,
                        borderRadius: 6,
                        transition: "all 0.3s",
                      }}
                    >
                      <Text ellipsis style={{ fontSize: 13 }}>
                        {team.teamName}
                      </Text>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty
                description="No teams available"
                style={{ margin: "20px 0" }}
              />
            )}
          </div>
        </Card>

        {/* Match Scheduling Card */}
        <Card
          size="small"
          title={
            <Space>
              <CalendarOutlined />
              <span>Match Scheduling</span>
              {matchDates.length > 0 && (
                <Text type="success" style={{ fontSize: 12 }}>
                  ({matchDates.length} dates added)
                </Text>
              )}
            </Space>
          }
          extra={
            matchDates.length === 0 && (
              <Text type="danger" style={{ fontSize: 12 }}>
                At least 1 date required
              </Text>
            )
          }
          style={{ borderRadius: 8 }}
        >
          {/* Time Configuration */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong style={{ fontSize: 13 }}>
                  Time Gap Between Matches
                </Text>
                <InputNumber
                  value={timeGapMinutes}
                  onChange={(val) => setTimeGapMinutes(val || 120)}
                  min={5}
                  max={480}
                  step={5}
                  addonAfter="min"
                  size="large"
                  style={{ width: "100%" }}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Time from end of one match to start of next
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong style={{ fontSize: 13 }}>
                  Match Duration
                </Text>
                <InputNumber
                  value={matchDurationMinutes}
                  onChange={(val) => setMatchDurationMinutes(val || 90)}
                  min={10}
                  max={180}
                  step={5}
                  addonAfter="min"
                  size="large"
                  style={{ width: "100%" }}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Duration of each match
                </Text>
              </Space>
            </Col>
          </Row>

          {/* Add Date Section */}
          <div
            style={{
              padding: 12,
              background: token.colorBgLayout,
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            <Row gutter={[8, 8]} align="middle">
              <Col xs={24} sm={10}>
                <DatePicker
                  placeholder="Select date"
                  value={newMatchDate}
                  onChange={setNewMatchDate}
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  disabledDate={disabledDate}
                  size="large"
                />
              </Col>
              <Col xs={24} sm={8}>
                <TimePicker
                  placeholder="Select time"
                  value={newMatchTime}
                  onChange={setNewMatchTime}
                  style={{ width: "100%" }}
                  format="HH:mm"
                  minuteStep={15}
                  size="large"
                />
              </Col>
              <Col xs={24} sm={6}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddMatchDate}
                  block
                  size="large"
                  disabled={!newMatchDate || !newMatchTime}
                >
                  Add
                </Button>
              </Col>
            </Row>
          </div>

          {/* Match Dates List */}
          {matchDates.length > 0 ? (
            <div
              style={{
                maxHeight: 150,
                overflowY: "auto",
                padding: 8,
                background: token.colorBgLayout,
                borderRadius: 6,
              }}
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                {matchDates.map((date, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: token.colorBgContainer,
                      borderRadius: 6,
                      border: `1px solid ${token.colorBorder}`,
                    }}
                  >
                    <Space size="small">
                      <CalendarOutlined style={{ color: token.colorPrimary }} />
                      <Text strong style={{ fontSize: 13 }}>
                        {dayjs(date).format("DD/MM/YYYY")}
                      </Text>
                      <ClockCircleOutlined
                        style={{ color: token.colorTextSecondary }}
                      />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {dayjs(date).format("HH:mm")}
                      </Text>
                    </Space>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveMatchDate(index)}
                      size="small"
                    />
                  </div>
                ))}
              </Space>
            </div>
          ) : (
            <Empty
              description="No dates added yet"
              style={{ padding: "20px 0" }}
              imageStyle={{ height: 40 }}
            />
          )}
        </Card>

        {/* Warnings */}
        {!schedulingValidation.isValid && (
          <Alert
            message="Scheduling Warning"
            description={schedulingValidation.warning}
            type="warning"
            showIcon
            closable
          />
        )}

        {schedulingValidation.isValid && schedulingValidation.warning && (
          <Alert
            message="Scheduling Recommendation"
            description={schedulingValidation.warning}
            type="info"
            showIcon
            closable
          />
        )}

        {/* Preview Panel */}
        {selectedTeams.length >= 2 && matchDates.length > 0 && (
          <Card
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
              border: `2px solid ${token.colorPrimaryBorder}`,
              borderRadius: 12,
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div style={{ textAlign: "center" }}>
                <Text
                  strong
                  style={{ fontSize: 16, color: token.colorPrimary }}
                >
                  📊 Fixture Preview
                </Text>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8}>
                  <div style={{ textAlign: "center" }}>
                    <Statistic
                      title="Total Matches"
                      value={estimatedMatchCount}
                      prefix={<TrophyOutlined />}
                      valueStyle={{
                        color: token.colorPrimary,
                        fontSize: window.innerWidth < 576 ? 20 : 28,
                      }}
                    />
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ textAlign: "center" }}>
                    <Statistic
                      title="Est. Duration"
                      value={estimatedDuration?.totalHours || 0}
                      suffix="hrs"
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{
                        color: token.colorSuccess,
                        fontSize: window.innerWidth < 576 ? 20 : 28,
                      }}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: "center" }}>
                    <Statistic
                      title="Matches/Day"
                      value={estimatedDuration?.matchesPerDay || 0}
                      prefix={<CalendarOutlined />}
                      valueStyle={{
                        color: token.colorWarning,
                        fontSize: window.innerWidth < 576 ? 20 : 28,
                      }}
                    />
                  </div>
                </Col>
              </Row>

              {estimatedDateRange && (
                <div
                  style={{
                    padding: 12,
                    background: token.colorBgContainer,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                    textAlign: "center",
                  }}
                >
                  <Text strong>Date Range</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <div>
                        <Text style={{ fontSize: 13 }}>
                          {estimatedDateRange.firstDate.format(
                            "DD MMM YYYY, HH:mm"
                          )}
                        </Text>
                      </div>
                      <div>↓</div>
                      <div>
                        <Text style={{ fontSize: 13 }}>
                          {estimatedDateRange.lastDate.format(
                            "DD MMM YYYY, HH:mm"
                          )}
                        </Text>
                      </div>
                    </Space>
                  </div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, marginTop: 4, display: "block" }}
                  >
                    ({estimatedDuration?.totalDays || 0} day
                    {estimatedDuration?.totalDays !== 1 ? "s" : ""})
                  </Text>
                </div>
              )}

              {estimatedDuration && estimatedDuration.matchesPerDay > 8 && (
                <Alert
                  message="High Match Density"
                  description="Consider spreading matches across more days or increasing the time gap."
                  type="info"
                  showIcon
                  style={{ marginBottom: 0 }}
                />
              )}
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
}
