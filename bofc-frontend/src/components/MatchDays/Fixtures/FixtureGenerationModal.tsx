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
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useGenerateFixturesMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { MatchDayType } from "../../../state/features/fixtures/fixtureTypes";
import {
  calculateMatchCount,
  estimateMatchDayDuration,
  validateSchedulingParameters,
  generateRoundRobinSchedule,
  getMatchDayTypeName,
  getMatchDayTypeDescription,
} from "../../../utils/matchDayCalculations";

const { Text } = Typography;

interface FixtureGenerationModalProps {
  matchDayId: number;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  teams: Array<{ teamId: number; teamName: string }>;
  onSuccess?: () => void;
  matchDayStartDate?: string; // Add matchDay start date prop
}

export default function FixtureGenerationModal({
  matchDayId,
  isModalVisible,
  handleSetIsModalVisible,
  teams,
  onSuccess,
  matchDayStartDate,
}: FixtureGenerationModalProps) {
  const { token } = theme.useToken();
  const loginInfo = useSelector(selectLoginInfo);
  const [form] = Form.useForm();
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | undefined>();

  // Single MatchDay start date/time — this is the only date the backend actually
  // reads (GenerateFixturesAsync uses request.MatchDates[0]); every subsequent
  // match's start is computed from duration/gap/break, not entered by hand.
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);

  // Scheduling parameters — gap is the breather AFTER one match ends and BEFORE the
  // next starts (not the full start-to-start interval; see matchDayCalculations.ts).
  const [timeGapMinutes, setTimeGapMinutes] = useState<number>(2);
  const [matchDurationMinutes, setMatchDurationMinutes] = useState<number>(13);
  const [matchDayType, setMatchDayType] = useState<MatchDayType>(
    MatchDayType.ROUND_ROBIN
  );

  // Optional one-time break, e.g. a breather partway through the MatchDay.
  const [breakAfterMatchNumber, setBreakAfterMatchNumber] = useState<number | undefined>();
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(10);

  const [generateFixtures, { isLoading }] = useGenerateFixturesMutation();
  const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();

  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");

  // Calculate estimated match count based on matchDay type
  const estimatedMatchCount = useMemo(() => {
    if (selectedTeams.length < 2) return 0;
    return calculateMatchCount(selectedTeams.length, matchDayType);
  }, [selectedTeams.length, matchDayType]);

  const combinedStart = useMemo(() => {
    if (!startDate || !startTime) return null;
    return startDate.hour(startTime.hour()).minute(startTime.minute()).second(0);
  }, [startDate, startTime]);

  // Calculate estimated matchDay duration
  const estimatedDuration = useMemo(() => {
    if (estimatedMatchCount === 0) return null;
    return estimateMatchDayDuration(
      estimatedMatchCount,
      timeGapMinutes,
      matchDurationMinutes,
      breakAfterMatchNumber ? breakDurationMinutes : 0
    );
  }, [estimatedMatchCount, timeGapMinutes, matchDurationMinutes, breakAfterMatchNumber, breakDurationMinutes]);

  // Real per-match schedule — same formula the backend uses, so this is exactly
  // what will be generated, not just an aggregate estimate.
  const schedule = useMemo(() => {
    if (selectedTeams.length < 2 || !combinedStart) return [];
    return generateRoundRobinSchedule(
      selectedTeams,
      combinedStart.toDate(),
      matchDurationMinutes,
      timeGapMinutes,
      breakAfterMatchNumber,
      breakDurationMinutes
    );
  }, [selectedTeams, combinedStart, matchDurationMinutes, timeGapMinutes, breakAfterMatchNumber, breakDurationMinutes]);

  const teamNameById = useMemo(() => new Map(teams.map((t) => [t.teamId, t.teamName])), [teams]);

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

  const resetForm = () => {
    setSelectedTeams([]);
    setSelectedVenueId(undefined);
    setStartDate(null);
    setStartTime(null);
    setTimeGapMinutes(2);
    setMatchDurationMinutes(13);
    setMatchDayType(MatchDayType.ROUND_ROBIN);
    setBreakAfterMatchNumber(undefined);
    setBreakDurationMinutes(10);
  };

  const handleGenerate = async () => {
    if (selectedTeams.length < 2) {
      message.error("Select at least 2 teams");
      return;
    }

    if (!combinedStart) {
      message.error("Select a start date and time");
      return;
    }

    // Show warning if scheduling parameters are invalid
    if (!schedulingValidation.isValid) {
      message.warning(schedulingValidation.warning);
      // Still allow generation but with warning
    }

    try {
      await generateFixtures({
        matchDayId,
        teamIds: selectedTeams,
        matchDates: [combinedStart.format("YYYY-MM-DDTHH:mm:ss")],
        timeGapMinutes,
        matchDurationMinutes,
        matchDayType,
        ...(breakAfterMatchNumber && { breakAfterMatchNumber, breakDurationMinutes }),
        ...(selectedVenueId && { venueId: selectedVenueId }),
      }).unwrap();

      message.success(
        `Successfully generated ${estimatedMatchCount} fixtures!`
      );

      resetForm();
      handleSetIsModalVisible(false);
      onSuccess?.();
    } catch (error) {
      message.error("Failed to generate fixtures");
    }
  };

  const handleCancel = () => {
    resetForm();
    handleSetIsModalVisible(false);
  };

  const minDate = matchDayStartDate ? dayjs(matchDayStartDate) : dayjs();

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
          disabled={selectedTeams.length < 2 || !combinedStart}
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
        {/* MatchDay Type & Venue Card */}
        <Card
          size="small"
          title={
            <Space>
              <TrophyOutlined />
              MatchDay Configuration
            </Space>
          }
          style={{ borderRadius: 8 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="MatchDay Type" style={{ marginBottom: 0 }}>
                <Select
                  value={matchDayType}
                  onChange={setMatchDayType}
                  size="large"
                  style={{ width: "100%" }}
                >
                  {[
                    MatchDayType.ROUND_ROBIN,
                    MatchDayType.DOUBLE_ROUND_ROBIN,
                    MatchDayType.GROUP_STAGE,
                    MatchDayType.KNOCKOUT,
                  ].map((type) => (
                    <Select.Option
                      key={type}
                      value={type}
                      disabled={type !== MatchDayType.ROUND_ROBIN}
                      label={getMatchDayTypeName(type)}
                    >
                      <Tooltip
                        title={
                          type === MatchDayType.ROUND_ROBIN
                            ? getMatchDayTypeDescription(type)
                            : "Not implemented yet — fixture generation only produces round-robin pairings today"
                        }
                        placement="right"
                      >
                        <div style={{ padding: "0px" }}>
                          <div style={{ fontWeight: 400 }}>
                            {getMatchDayTypeName(type)}
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
            </Space>
          }
          extra={
            !combinedStart && (
              <Text type="danger" style={{ fontSize: 12 }}>
                Start time required
              </Text>
            )
          }
          style={{ borderRadius: 8 }}
        >
          {/* Start date/time — the only date the backend actually reads; every
              other match's start is computed from duration + gap + break below. */}
          <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong style={{ fontSize: 13 }}>Start Date</Text>
                <DatePicker
                  placeholder="Select date"
                  value={startDate}
                  onChange={setStartDate}
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  disabledDate={disabledDate}
                  size="large"
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong style={{ fontSize: 13 }}>Start Time</Text>
                <TimePicker
                  placeholder="Select time"
                  value={startTime}
                  onChange={setStartTime}
                  style={{ width: "100%" }}
                  format="HH:mm"
                  minuteStep={5}
                  size="large"
                />
              </Space>
            </Col>
          </Row>

          {/* Time Configuration */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong style={{ fontSize: 13 }}>
                  Match Duration
                </Text>
                <InputNumber
                  value={matchDurationMinutes}
                  onChange={(val) => setMatchDurationMinutes(val || 13)}
                  min={5}
                  max={180}
                  step={1}
                  addonAfter="min"
                  size="large"
                  style={{ width: "100%" }}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Duration of each match
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong style={{ fontSize: 13 }}>
                  Gap After Each Match
                </Text>
                <InputNumber
                  value={timeGapMinutes}
                  onChange={(val) => setTimeGapMinutes(val ?? 2)}
                  min={0}
                  max={120}
                  step={1}
                  addonAfter="min"
                  size="large"
                  style={{ width: "100%" }}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Breather between one match ending and the next starting
                </Text>
              </Space>
            </Col>
          </Row>

          {/* Optional one-time break */}
          <div
            style={{
              padding: 12,
              background: token.colorBgLayout,
              borderRadius: 6,
            }}
          >
            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
              Optional Break (not required)
            </Text>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <InputNumber
                  value={breakAfterMatchNumber}
                  onChange={(val) => setBreakAfterMatchNumber(val ?? undefined)}
                  min={1}
                  max={Math.max(1, estimatedMatchCount - 1)}
                  placeholder="After match #"
                  addonBefore="After match #"
                  size="large"
                  style={{ width: "100%" }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <InputNumber
                  value={breakDurationMinutes}
                  onChange={(val) => setBreakDurationMinutes(val || 10)}
                  min={1}
                  max={120}
                  addonAfter="min"
                  disabled={!breakAfterMatchNumber}
                  size="large"
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>
          </div>
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
        {selectedTeams.length >= 2 && combinedStart && (
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

              {schedule.length > 0 && (
                <div
                  style={{
                    padding: 8,
                    background: token.colorBgContainer,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  <Text strong style={{ display: "block", marginBottom: 8, paddingLeft: 4 }}>
                    Match-by-Match Schedule
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    {schedule.map((m) => (
                      <div
                        key={m.matchNumber}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          background: token.colorBgLayout,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 13 }}>
                          <Text strong>#{m.matchNumber}</Text>{" "}
                          {teamNameById.get(m.homeTeamId) || m.homeTeamId} vs{" "}
                          {teamNameById.get(m.awayTeamId) || m.awayTeamId}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                          {dayjs(m.start).format("HH:mm")} – {dayjs(m.end).format("HH:mm")}
                        </Text>
                      </div>
                    ))}
                  </Space>
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
