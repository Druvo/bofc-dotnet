import { useEffect, useState } from "react";
import { Modal, List, Button, Space, Typography, Tag, message } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined } from "@ant-design/icons";
import {
  GroupStandingResponse,
} from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { useApplyGroupTiebreakMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";

const { Text, Paragraph } = Typography;

interface GroupTiebreakModalProps {
  open: boolean;
  groupId: number | null;
  groupName: string;
  standings: GroupStandingResponse[];
  onClose: () => void;
  onApplied: () => void;
}

/**
 * Lets an admin record the penalty-shootout result by reordering teams into
 * their final finishing order. The order is sent as orderedTeamIds; the backend
 * stores it as the decisive tiebreak applied only when teams are otherwise level.
 */
export default function GroupTiebreakModal({
  open,
  groupId,
  groupName,
  standings,
  onClose,
  onApplied,
}: GroupTiebreakModalProps) {
  const [ordered, setOrdered] = useState<GroupStandingResponse[]>([]);
  const [applyTiebreak, { isLoading }] = useApplyGroupTiebreakMutation();

  // Seed the working list from the current standings order whenever opened.
  useEffect(() => {
    if (open) {
      setOrdered([...standings].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    }
  }, [open, standings]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    setOrdered(next);
  };

  const handleApply = async () => {
    if (!groupId) return;
    try {
      await applyTiebreak({
        groupId,
        orderedTeamIds: ordered.map((s) => s.teamId),
      }).unwrap();
      message.success("Tiebreak applied and standings updated");
      onApplied();
      onClose();
    } catch {
      // Error surfaced by the API slice
    }
  };

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined />
          <span>Manual Tiebreak — {groupName}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleApply}
      okText="Apply Tiebreak"
      confirmLoading={isLoading}
      okButtonProps={{ disabled: ordered.length === 0 }}
    >
      <Paragraph type="secondary">
        Use this only to break a tie that points, goal difference, goals for,
        head-to-head and fair play could not resolve (e.g. a penalty shootout).
        Arrange the teams in their final finishing order — the top team ranks
        highest.
      </Paragraph>
      <List
        size="small"
        bordered
        dataSource={ordered}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button
                key="up"
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              />,
              <Button
                key="down"
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={index === ordered.length - 1}
                onClick={() => move(index, 1)}
              />,
            ]}
          >
            <Space>
              <Tag color="blue">{index + 1}</Tag>
              <Text>{item.teamName}</Text>
              <Text type="secondary">
                {item.points} pts · GD {item.goalDifference} · GF {item.goalsFor}
              </Text>
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
}
