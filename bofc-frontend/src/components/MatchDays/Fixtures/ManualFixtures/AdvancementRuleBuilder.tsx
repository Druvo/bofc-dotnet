import { useState, useEffect } from "react";
import { Card, Radio, InputNumber, Select, Space, Typography, Alert, Divider, Tag } from "antd";
import { InfoCircleOutlined, TrophyOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

interface AdvancementRuleBuilderProps {
  value?: string; // JSON string
  onChange?: (value: string) => void;
  numberOfGroups?: number;
  teamsPerGroup?: number;
}

type RuleType = "topN" | "winnersOnly" | "bestThirdPlace" | "custom";
type TiebreakerCriteria = "points" | "goalDifference" | "goalsFor" | "goalsAgainst" | "headToHead";

interface AdvancementRule {
  topN?: number;
  winnersOnly?: boolean;
  bestThirdPlace?: number;
  criteria?: TiebreakerCriteria[];
  pointsThreshold?: number;
}

/**
 * AdvancementRuleBuilder - Visual builder for advancement rules
 *
 * Replaces raw JSON input with a user-friendly interface for defining
 * how teams advance from group stages to knockout rounds.
 */
export default function AdvancementRuleBuilder({
  value,
  onChange,
  numberOfGroups = 8,
  teamsPerGroup = 4,
}: AdvancementRuleBuilderProps) {
  const [ruleType, setRuleType] = useState<RuleType>("topN");
  const [topN, setTopN] = useState<number>(2);
  const [bestThirdPlaceCount, setBestThirdPlaceCount] = useState<number>(4);
  const [pointsThreshold, setPointsThreshold] = useState<number>(0);
  const [tiebreakers, setTiebreakers] = useState<TiebreakerCriteria[]>([
    "points",
    "goalDifference",
    "goalsFor",
  ]);

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      try {
        const parsed: AdvancementRule = JSON.parse(value);
        if (parsed.topN) {
          setRuleType("topN");
          setTopN(parsed.topN);
        } else if (parsed.winnersOnly) {
          setRuleType("winnersOnly");
        } else if (parsed.bestThirdPlace) {
          setRuleType("bestThirdPlace");
          setBestThirdPlaceCount(parsed.bestThirdPlace);
        } else {
          setRuleType("custom");
        }

        if (parsed.criteria) {
          setTiebreakers(parsed.criteria);
        }
        if (parsed.pointsThreshold) {
          setPointsThreshold(parsed.pointsThreshold);
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, [value]);

  // Generate JSON and call onChange
  useEffect(() => {
    const rule: AdvancementRule = {
      criteria: tiebreakers,
    };

    if (ruleType === "topN") {
      rule.topN = topN;
    } else if (ruleType === "winnersOnly") {
      rule.winnersOnly = true;
      rule.topN = 1;
    } else if (ruleType === "bestThirdPlace") {
      rule.topN = 2; // Top 2 from each group
      rule.bestThirdPlace = bestThirdPlaceCount;
    } else if (ruleType === "custom") {
      if (pointsThreshold > 0) {
        rule.pointsThreshold = pointsThreshold;
      }
    }

    const json = JSON.stringify(rule);
    if (onChange && json !== value) {
      onChange(json);
    }
  }, [ruleType, topN, bestThirdPlaceCount, pointsThreshold, tiebreakers, onChange, value]);

  const calculateTotalTeamsAdvancing = () => {
    if (ruleType === "topN") {
      return numberOfGroups * topN;
    } else if (ruleType === "winnersOnly") {
      return numberOfGroups;
    } else if (ruleType === "bestThirdPlace") {
      return numberOfGroups * 2 + bestThirdPlaceCount;
    } else {
      return "Custom";
    }
  };

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <span>Advancement Rule Builder</span>
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Rule Type Selection */}
        <div>
          <Text strong>Rule Type:</Text>
          <Radio.Group
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value)}
            style={{ marginTop: 8, width: "100%" }}
          >
            <Space direction="vertical" size={12}>
              <Radio value="topN">
                <strong>Top N Teams from each group</strong>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Most common: Top 2 teams from each group advance (used in World Cup, etc.)
                </Text>
              </Radio>

              <Radio value="winnersOnly">
                <strong>Winners Only</strong>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Only the 1st place team from each group advances
                </Text>
              </Radio>

              <Radio value="bestThirdPlace">
                <strong>Best Third Place Teams</strong>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Top 2 from each group + best N third-place finishers (used in UEFA Euro)
                </Text>
              </Radio>

              <Radio value="custom">
                <strong>Custom Criteria</strong>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Advanced: Define minimum points threshold or custom logic
                </Text>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Rule Configuration */}
        {ruleType === "topN" && (
          <div>
            <Text strong>Number of teams to advance from each group:</Text>
            <br />
            <InputNumber
              min={1}
              max={teamsPerGroup}
              value={topN}
              onChange={(val) => setTopN(val || 1)}
              style={{ marginTop: 8, width: 120 }}
            />
            <Text type="secondary" style={{ marginLeft: 12 }}>
              (Max: {teamsPerGroup} teams per group)
            </Text>
          </div>
        )}

        {ruleType === "bestThirdPlace" && (
          <div>
            <Text strong>Number of best third-place teams to advance:</Text>
            <br />
            <InputNumber
              min={1}
              max={numberOfGroups}
              value={bestThirdPlaceCount}
              onChange={(val) => setBestThirdPlaceCount(val || 1)}
              style={{ marginTop: 8, width: 120 }}
            />
            <Text type="secondary" style={{ marginLeft: 12 }}>
              (Max: {numberOfGroups} groups)
            </Text>
            <br />
            <Alert
              message="Top 2 from each group will advance automatically, plus the best third-place teams"
              type="info"
              showIcon
              style={{ marginTop: 12 }}
            />
          </div>
        )}

        {ruleType === "custom" && (
          <div>
            <Text strong>Minimum Points Threshold (optional):</Text>
            <br />
            <InputNumber
              min={0}
              max={100}
              value={pointsThreshold}
              onChange={(val) => setPointsThreshold(val || 0)}
              placeholder="0 = No threshold"
              style={{ marginTop: 8, width: 150 }}
            />
            <Text type="secondary" style={{ marginLeft: 12 }}>
              Teams must have at least this many points to advance
            </Text>
          </div>
        )}

        <Divider style={{ margin: "8px 0" }} />

        {/* Tiebreaker Criteria */}
        <div>
          <Text strong>Tiebreaker Criteria (in order of priority):</Text>
          <br />
          <Select
            mode="multiple"
            value={tiebreakers}
            onChange={setTiebreakers}
            style={{ marginTop: 8, width: "100%" }}
            placeholder="Select tiebreaker order"
          >
            <Option value="points">Points</Option>
            <Option value="goalDifference">Goal Difference</Option>
            <Option value="goalsFor">Goals For</Option>
            <Option value="goalsAgainst">Goals Against</Option>
            <Option value="headToHead">Head-to-Head Record</Option>
          </Select>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
            Drag to reorder. First criterion is checked first, then second, etc.
          </Text>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Preview */}
        <Alert
          message="Preview"
          description={
            <Space direction="vertical" size={4}>
              <div>
                <strong>Rule Summary:</strong>
                {ruleType === "topN" && ` Top ${topN} teams from each group`}
                {ruleType === "winnersOnly" && " Winners only"}
                {ruleType === "bestThirdPlace" &&
                  ` Top 2 from each group + ${bestThirdPlaceCount} best third-place teams`}
                {ruleType === "custom" &&
                  pointsThreshold > 0 &&
                  ` Minimum ${pointsThreshold} points required`}
                {ruleType === "custom" && pointsThreshold === 0 && " Custom logic"}
              </div>
              <div>
                <strong>Total Teams Advancing:</strong>{" "}
                <Tag color="blue">{calculateTotalTeamsAdvancing()}</Tag>
                {typeof calculateTotalTeamsAdvancing() === "number" && (
                  <Text type="secondary">
                    ({numberOfGroups} groups × {teamsPerGroup} teams = {numberOfGroups * teamsPerGroup} total)
                  </Text>
                )}
              </div>
              <div>
                <strong>Tiebreaker Order:</strong>{" "}
                {tiebreakers.map((t, i) => (
                  <Tag key={t} color="geekblue">
                    {i + 1}. {t}
                  </Tag>
                ))}
              </div>
            </Space>
          }
          type="success"
          icon={<InfoCircleOutlined />}
          showIcon
        />

        {/* Generated JSON */}
        <div>
          <Text type="secondary" strong>
            Generated Rule (JSON):
          </Text>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: 12,
              borderRadius: 4,
              fontSize: 12,
              marginTop: 8,
              overflow: "auto",
            }}
          >
            {JSON.stringify(
              {
                ...(ruleType === "topN" && { topN }),
                ...(ruleType === "winnersOnly" && { winnersOnly: true, topN: 1 }),
                ...(ruleType === "bestThirdPlace" && { topN: 2, bestThirdPlace: bestThirdPlaceCount }),
                ...(ruleType === "custom" && pointsThreshold > 0 && { pointsThreshold }),
                criteria: tiebreakers,
              },
              null,
              2
            )}
          </pre>
        </div>
      </Space>
    </Card>
  );
}
