import React from "react";
import { Modal, Button, Space, message, Empty } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import { useClearFixturesMutation } from "../../../state/features/fixtures/fixturesSlice";

interface ClearFixturesModalProps {
  tournamentId: number;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  fixtureCount: number;
  onSuccess?: () => void;
}

export default function ClearFixturesModal({
  tournamentId,
  isModalVisible,
  handleSetIsModalVisible,
  fixtureCount,
  onSuccess,
}: ClearFixturesModalProps) {
  const [clearFixtures, { isLoading }] = useClearFixturesMutation();

  const handleClearFixtures = async () => {
    try {
      await clearFixtures({ tournamentId }).unwrap();
      message.success("Fixtures cleared successfully!");
      handleSetIsModalVisible(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error clearing fixtures:", err);
    }
  };

  return (
    <Modal
      title={<Title level={3}>Clear Fixtures</Title>}
      open={isModalVisible}
      onCancel={() => handleSetIsModalVisible(false)}
      footer={null}
      width={500}
    >
      {fixtureCount === 0 ? (
        <Empty description="No fixtures to clear" />
      ) : (
        <div>
          <div style={{ marginBottom: 16, color: "#ff4d4f" }}>
            <ExclamationCircleOutlined style={{ marginRight: 8, fontSize: 18 }} />
            <strong>Warning: This action cannot be undone</strong>
          </div>
          <p>
            You are about to delete <strong>{fixtureCount} fixtures</strong> for this tournament.
          </p>
          <p>All match schedules and records will be permanently removed.</p>

          <Space>
            <Button
              danger
              onClick={handleClearFixtures}
              loading={isLoading}
            >
              Confirm Clear
            </Button>
            <Button onClick={() => handleSetIsModalVisible(false)}>
              Cancel
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
}
