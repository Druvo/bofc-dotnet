import React, { useState, useMemo } from "react";
import {
  Modal,
  Form,
  Button,
  message,
  Space,
  Checkbox,
  InputNumber,
  Empty,
  Select,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Card,
  theme,
  Tooltip,
} from "antd";
import {
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useGenerateFixturesMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { MatchDayType } from "../../../state/features/fixtures/fixtureTypes";
import {
  calculateMatchCount,
  estimateMatchDayDuration,
  validateSchedulingParameters,
  generateRoundRobinSchedule,
  getMatchDayTypeName,
  getMatchDayTypeDescription,
} from "../../../utils/matchDayCalculations";

dayjs.extend(utc);

const { Text } = Typography;

interface FixtureGenerationModalProps {
  matchDayId: number;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  teams: Array<{ teamId: number; teamName: string }>;
  onSuccess?: () => void;
  /** The MatchDay's own start date/time - the only date the backend actually reads
   * (GenerateFixturesAsync uses request.MatchDates[0]), so there's nothing for the
   * admin to enter here; every match's start is computed from it plus duration/gap. */
  matchDayStartDate?: string;
  /** The MatchDay's own total duration - used only to project how many matches fit
   * and flag it if the current duration/gap choice would run over. Venue similarly
   * isn't asked for here: the backend already defaults to the MatchDay's own venue
   * when none is passed. */
  matchDayDurationMinutes?: number | null;
}

export default function FixtureGenerationModal({
  matchDayId,
  isModalVisible,
  handleSetIsModalVisible,
  teams,
  onSuccess,
  matchDayStartDate,
  matchDayDurationMinutes,
}: FixtureGenerationModalProps) {
  const { token } = theme.useToken();
  const loginInfo = useSelector(selectLoginInfo);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);

  // Scheduling parameters - gap is the breather AFTER one match ends and BEFORE the
  // next starts (not the full start-to-start interval; see matchDayCalculations.ts).
  const [timeGapMinutes, setTimeGapMinutes] = useState<number>(2);
  const [matchDurationMinutes, setMatchDurationMinutes] = useState<number>(13);
  const [matchDayType, setMatchDayType] = useState<MatchDayType>(
    MatchDayType.ROUND_ROBIN
  );

  const [generateFixtures, { isLoading }] = useGenerateFixturesMutation();

  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");

  const combinedStart = useMemo(
    () => (matchDayStartDate ? dayjs(matchDayStartDate) : null),
    [matchDayStartDate]
  );

  // One full cycle - each selected team plays every other once (or twice, for double
  // round-robin - though that type is currently disabled in the Select below).
  const oneCycleMatchCount = useMemo(() => {
    if (selectedTeams.length < 2) return 0;
    return calculateMatchCount(selectedTeams.length, matchDayType);
  }, [selectedTeams.length, matchDayType]);

  // How many matches actually fit inside the MatchDay's own duration, at the
  // currently chosen match duration + gap - the "project how many matches can be
  // played" the admin asked for, computed live as they adjust either value.
  const maxMatchesThatFit = useMemo(() => {
    if (!matchDayDurationMinutes || matchDayDurationMinutes <= 0) return null;
    const slotMinutes = matchDurationMinutes + timeGapMinutes;
    if (slotMinutes <= 0) return null;
    return Math.max(0, Math.floor(matchDayDurationMinutes / slotMinutes));
  }, [matchDayDurationMinutes, matchDurationMinutes, timeGapMinutes]);

  // A single round-robin cycle usually only fills a fraction of the MatchDay's own duration
  // (e.g. 3 teams -> 1 cycle -> 3 matches -> 45 min of a 90-min window) - repeat the cycle to
  // use up the remaining time instead of generating a slate that stops halfway through the
  // MatchDay, matching FixtureGenerationService.GenerateFixturesAsync's identical repeat-to-fill
  // logic for a single-day request (this modal always targets exactly one day/MatchDay).
  const estimatedMatchCount =
    matchDayType === MatchDayType.ROUND_ROBIN && maxMatchesThatFit !== null && maxMatchesThatFit > oneCycleMatchCount
      ? maxMatchesThatFit
      : oneCycleMatchCount;

  // Calculate estimated matchDay duration
  const estimatedDuration = useMemo(() => {
    if (estimatedMatchCount === 0) return null;
    return estimateMatchDayDuration(estimatedMatchCount, timeGapMinutes, matchDurationMinutes);
  }, [estimatedMatchCount, timeGapMinutes, matchDurationMinutes]);

  // estimatedDuration.matchesPerDay is a raw CAPACITY figure - how many matches would fit in a
  // 12-hour day at this pace, independent of how many are actually being scheduled. Displaying
  // it as-is under "Matches/Day" (and gating the density warning on it) was misleading: e.g. 2
  // teams -> 1 real match still showed "48" and fired "High Match Density" purely because the
  // slot size is short, even though nothing is actually being packed anywhere. Cap it at the
  // real match count so both the stat and the warning reflect what's actually being scheduled.
  const actualMatchesPerDay = Math.min(estimatedMatchCount, estimatedDuration?.matchesPerDay || 0);

  // Only meaningful for match types that DON'T repeat-to-fill (round-robin always fills up to
  // maxMatchesThatFit above, so it can never "exceed" its own capacity).
  const exceedsMatchDayDuration =
    matchDayType !== MatchDayType.ROUND_ROBIN &&
    maxMatchesThatFit !== null && estimatedMatchCount > maxMatchesThatFit;

  // Real per-match schedule - same formula the backend uses, so this is exactly
  // what will be generated, not just an aggregate estimate.
  const schedule = useMemo(() => {
    if (selectedTeams.length < 2 || !combinedStart) return [];
    return generateRoundRobinSchedule(
      selectedTeams,
      combinedStart.toDate(),
      matchDurationMinutes,
      timeGapMinutes,
      undefined,
      0,
      estimatedMatchCount
    );
  }, [selectedTeams, combinedStart, matchDurationMinutes, timeGapMinutes, estimatedMatchCount]);

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
    setTimeGapMinutes(2);
    setMatchDurationMinutes(13);
    setMatchDayType(MatchDayType.ROUND_ROBIN);
  };

  const handleGenerate = async () => {
    if (selectedTeams.length < 2) {
      message.error("Select at least 2 teams");
      return;
    }

    if (!combinedStart) {
      message.error("This Match Day has no date set - set one before generating fixtures");
      return;
    }

    // Show warning if scheduling parameters are invalid
    if (!schedulingValidation.isValid) {
      message.warning(schedulingValidation.warning);
      // Still allow generation but with warning
    }

    try {
      // Match.MatchDate is a genuinely UTC-shifted value on every other match-creation path
      // (AddMatchModal, EditFixtureModal, RoundMatchGenerationModal, GroupMatchGenerationModal
      // all convert via .utc() before submitting) - combinedStart itself is deliberately parsed
      // WITHOUT conversion (matchDayStartDate/matchDayDate is naive-local Dhaka, see utils.ts),
      // so convert it to UTC here, at the point of sending, rather than displaying it converted.
      // Sending the naive value straight through previously seeded generated matches with
      // Dhaka-local numbers mislabeled as UTC, shifting their displayed time by 6 hours on every
      // fixture view that reads matchDate back via the (correct) .utc().local() convention.
      await generateFixtures({
        matchDayId,
        teamIds: selectedTeams,
        matchDates: [combinedStart.utc().format("YYYY-MM-DDTHH:mm:ss")],
        timeGapMinutes,
        matchDurationMinutes,
        matchDayType,
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
        {/* MatchDay Type Card */}
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
          <Form.Item label="Match Day Type" style={{ marginBottom: 0 }}>
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
                        : "Not implemented yet - fixture generation only produces round-robin pairings today"
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

        {/* Match Scheduling Card - start date/time and venue aren't asked for here:
            both already come from the MatchDay itself. Only per-match duration and
            the gap between matches are set here, and the count of matches that fit
            is projected live below from the MatchDay's own total duration. */}
        <Card
          size="small"
          title={
            <Space>
              <CalendarOutlined />
              <span>Match Duration</span>
            </Space>
          }
          style={{ borderRadius: 8 }}
        >
          {combinedStart && (
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
              Kicks off {combinedStart.format("DD MMM YYYY, hh:mm A")}
              {matchDayDurationMinutes ? ` - Match Day runs for ${matchDayDurationMinutes} min` : ""}, from the Match Day's own schedule.
            </Text>
          )}

          <Row gutter={[12, 12]}>
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

          {maxMatchesThatFit !== null && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: token.colorBgLayout,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 13 }}>
                At {matchDurationMinutes} min/match + {timeGapMinutes} min gap, up to{" "}
                <Text strong>{maxMatchesThatFit}</Text> match{maxMatchesThatFit === 1 ? "" : "es"} fit in this Match Day's {matchDayDurationMinutes}-minute window.
              </Text>
            </div>
          )}
        </Card>

        {/* Warnings */}
        {exceedsMatchDayDuration && (
          <Alert
            message="Won't fit in the Match Day's duration"
            description={`${estimatedMatchCount} matches selected, but only ${maxMatchesThatFit} fit within ${matchDayDurationMinutes} minutes at this duration/gap - shorten matches, reduce the gap, or select fewer teams.`}
            type="warning"
            showIcon
            closable
          />
        )}

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
                      value={actualMatchesPerDay}
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
                          {dayjs(m.start).format("hh:mm A")} – {dayjs(m.end).format("hh:mm A")}
                        </Text>
                      </div>
                    ))}
                  </Space>
                </div>
              )}

              {estimatedDuration && actualMatchesPerDay > 8 && (
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
