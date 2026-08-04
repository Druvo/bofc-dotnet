import { useState, useEffect } from "react";
import { Modal, Form, Input, Radio, Select, Space, Alert, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useCreatePlaceholderTeamMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { toast } from "react-toastify";

const { Text } = Typography;

interface PlaceholderTeamModalProps {
  visible: boolean;
  onClose: () => void;
  groupId?: number;
  roundId?: number;
  groups?: Array<{ id: number; groupName: string }>;
  matches?: Array<{ id: number; homeTeamName: string; awayTeamName: string }>;
}

type SourceType = "match" | "group" | "custom";

/**
 * PlaceholderTeamModal - Create TBD (To Be Determined) team slots
 *
 * Used for knockout rounds where teams depend on previous round results:
 * - "Winner of Match X"
 * - "Loser of Match X"
 * - "1st Place from Group A"
 * - "2nd Place from Group B"
 * - Custom rule
 */
export default function PlaceholderTeamModal({
  visible,
  onClose,
  groupId,
  roundId,
  groups = [],
  matches = [],
}: PlaceholderTeamModalProps) {
  const [form] = Form.useForm();
  const [createPlaceholder, { isLoading }] = useCreatePlaceholderTeamMutation();

  const [sourceType, setSourceType] = useState<SourceType>("match");
  const [matchPosition, setMatchPosition] = useState<"winner" | "loser">("winner");
  const [selectedMatch, setSelectedMatch] = useState<number | undefined>();
  const [selectedGroup, setSelectedGroup] = useState<number | undefined>();
  const [groupPosition, setGroupPosition] = useState<number>(1);
  const [customRule, setCustomRule] = useState<string>("");

  // Auto-generate placeholder name based on selection
  useEffect(() => {
    let name = "";

    if (sourceType === "match" && selectedMatch) {
      const match = matches.find((m) => m.id === selectedMatch);
      if (match) {
        name = `${matchPosition === "winner" ? "Winner" : "Loser"} of ${match.homeTeamName} vs ${match.awayTeamName}`;
      }
    } else if (sourceType === "group" && selectedGroup) {
      const group = groups.find((g) => g.id === selectedGroup);
      if (group) {
        const positionSuffix = groupPosition === 1 ? "st" : groupPosition === 2 ? "nd" : groupPosition === 3 ? "rd" : "th";
        name = `${groupPosition}${positionSuffix} Place from ${group.groupName}`;
      }
    } else if (sourceType === "custom" && customRule) {
      // Parse custom rule if possible
      try {
        const rule = JSON.parse(customRule);
        if (rule.matchId) {
          name = `${rule.position === "winner" ? "Winner" : "Loser"} of Match ${rule.matchId}`;
        } else if (rule.groupId) {
          name = `Position ${rule.position} from Group ${rule.groupId}`;
        }
      } catch {
        name = "Custom Placeholder";
      }
    }

    if (name) {
      form.setFieldsValue({ placeholderName: name });
    }
  }, [sourceType, selectedMatch, matchPosition, selectedGroup, groupPosition, customRule, form, matches, groups]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Build source rule JSON
      let sourceRule: any = {};

      if (sourceType === "match" && selectedMatch) {
        sourceRule = {
          matchId: selectedMatch,
          position: matchPosition,
        };
      } else if (sourceType === "group" && selectedGroup) {
        sourceRule = {
          groupId: selectedGroup,
          position: groupPosition,
        };
      } else if (sourceType === "custom" && customRule) {
        try {
          sourceRule = JSON.parse(customRule);
        } catch {
          toast.error("Invalid JSON in custom rule");
          return;
        }
      }

      const payload = {
        ...(groupId && { groupId }),
        ...(roundId && { roundId }),
        placeholderName: values.placeholderName,
        sourceRule: JSON.stringify(sourceRule),
      };

      await createPlaceholder(payload).unwrap();
      toast.success("Placeholder team created successfully");
      handleClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create placeholder team");
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSourceType("match");
    setMatchPosition("winner");
    setSelectedMatch(undefined);
    setSelectedGroup(undefined);
    setGroupPosition(1);
    setCustomRule("");
    onClose();
  };

  return (
    <Modal
      title="Create Placeholder Team"
      open={visible}
      onCancel={handleClose}
      onOk={handleSubmit}
      confirmLoading={isLoading}
      okText="Create Placeholder"
      cancelText="Cancel"
      width={600}
    >
      <Alert
        message="What are placeholder teams?"
        description="Placeholder teams are 'TBD' slots that will be filled automatically when the source match/group is completed. Use them for knockout rounds where teams depend on previous results."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          label="Placeholder Name"
          name="placeholderName"
          rules={[{ required: true, message: "Please enter a placeholder name" }]}
          extra="This will be displayed in the tournament bracket until the actual team is determined"
        >
          <Input placeholder='e.g., "Winner of Match 5" or "2nd Place Group A"' />
        </Form.Item>

        <Form.Item label="Source Type" required>
          <Radio.Group value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <Space direction="vertical" size={16}>
              <Radio value="match">
                <strong>From Match Result</strong>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Team determined by winner or loser of a specific match
                </Text>
              </Radio>

              <Radio value="group">
                <strong>From Group Standing</strong>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Team determined by final position in a group
                </Text>
              </Radio>

              <Radio value="custom">
                <strong>Custom Rule (JSON)</strong>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Define your own advancement logic
                </Text>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {sourceType === "match" && (
          <Space direction="vertical" size={12} style={{ width: "100%", marginBottom: 16 }}>
            <Form.Item
              label="Select Match"
              rules={[{ required: true, message: "Please select a match" }]}
            >
              <Select
                placeholder="Choose a match"
                value={selectedMatch}
                onChange={setSelectedMatch}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={matches.map((match) => ({
                  label: `Match ${match.id}: ${match.homeTeamName} vs ${match.awayTeamName}`,
                  value: match.id,
                }))}
              />
            </Form.Item>

            <Form.Item label="Position">
              <Radio.Group value={matchPosition} onChange={(e) => setMatchPosition(e.target.value)}>
                <Radio value="winner">Winner of match</Radio>
                <Radio value="loser">Loser of match</Radio>
              </Radio.Group>
            </Form.Item>
          </Space>
        )}

        {sourceType === "group" && (
          <Space direction="vertical" size={12} style={{ width: "100%", marginBottom: 16 }}>
            <Form.Item
              label="Select Group"
              rules={[{ required: true, message: "Please select a group" }]}
            >
              <Select
                placeholder="Choose a group"
                value={selectedGroup}
                onChange={setSelectedGroup}
                options={groups.map((group) => ({
                  label: group.groupName,
                  value: group.id,
                }))}
              />
            </Form.Item>

            <Form.Item label="Position in Group">
              <Select
                value={groupPosition}
                onChange={setGroupPosition}
                options={[
                  { label: "1st Place", value: 1 },
                  { label: "2nd Place", value: 2 },
                  { label: "3rd Place", value: 3 },
                  { label: "4th Place", value: 4 },
                  { label: "5th Place", value: 5 },
                  { label: "6th Place", value: 6 },
                ]}
              />
            </Form.Item>
          </Space>
        )}

        {sourceType === "custom" && (
          <Form.Item
            label="Custom Rule (JSON)"
            extra='Example: {"matchId": 5, "position": "winner"} or {"groupId": 1, "position": 2}'
          >
            <Input.TextArea
              rows={4}
              placeholder='{"matchId": 5, "position": "winner"}'
              value={customRule}
              onChange={(e) => setCustomRule(e.target.value)}
            />
          </Form.Item>
        )}

        <Alert
          message="Preview"
          description={
            <div>
              <strong>Placeholder Name:</strong> {form.getFieldValue("placeholderName") || "Not set"}
              <br />
              <strong>Source Rule:</strong>{" "}
              {sourceType === "match" && selectedMatch && (
                <code>{`{"matchId": ${selectedMatch}, "position": "${matchPosition}"}`}</code>
              )}
              {sourceType === "group" && selectedGroup && (
                <code>{`{"groupId": ${selectedGroup}, "position": ${groupPosition}}`}</code>
              )}
              {sourceType === "custom" && customRule && <code>{customRule}</code>}
            </div>
          }
          type="success"
          style={{ marginTop: 16 }}
        />
      </Form>
    </Modal>
  );
}
