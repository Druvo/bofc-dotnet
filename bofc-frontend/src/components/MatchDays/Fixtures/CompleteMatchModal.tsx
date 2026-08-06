import React from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import moment from "moment";
import Modal from "../../ui/modal";
import Button from "../../ui/button";

interface CompleteMatchModalProps {
  open: boolean;
  fixture: IFixture;
  onCancel: () => void;
  onConfirm: (matchDurationMinutes?: number) => Promise<void>;
  isLoading?: boolean;
}

export default function CompleteMatchModal({
  open,
  fixture,
  onCancel,
  onConfirm,
  isLoading = false,
}: CompleteMatchModalProps) {
  const calculateActualDuration = (): number | undefined => {
    if (fixture.startedAt && fixture.elapsedTimeSeconds !== undefined && fixture.elapsedTimeSeconds !== null) {
      const minutes = Math.max(1, Math.ceil(fixture.elapsedTimeSeconds / 60));
      return Math.min(minutes, 120);
    }
    const duration = fixture.matchDurationMinutes || 90;
    return duration > 0 ? Math.min(duration, 120) : 90;
  };

  const handleOk = async () => {
    try {
      const duration = calculateActualDuration();
      await onConfirm(duration);
    } catch (error) {
      console.error("Failed to complete match:", error);
    }
  };

  const actualDuration = calculateActualDuration();
  const startedAt = fixture.startedAt
    ? moment.utc(fixture.startedAt).local().format("YYYY-MM-DD HH:mm:ss")
    : null;

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title={<span className="flex items-center gap-2"><CheckCircleOutlined className="text-success-500" />Complete Match</span>}
      className="max-w-[500px]"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="danger" size="sm" startIcon={<CheckCircleOutlined />} disabled={isLoading} onClick={handleOk}>Complete Match</Button>
        </>
      }
    >
      <div className="rounded-lg border border-warning-500/30 bg-warning-50 px-4 py-3 dark:bg-warning-500/10">
        <p className="text-theme-xs text-gray-600 dark:text-gray-300">
          <strong>Match:</strong> {fixture.homeTeamName} {fixture.homeTeamScore} - {fixture.awayTeamScore} {fixture.awayTeamName}
          <br />
          {startedAt && (
            <>
              <strong>Started at:</strong> {startedAt}
              <br />
            </>
          )}
          {actualDuration && (
            <>
              <strong>Match Duration:</strong> {actualDuration} minutes (based on elapsed time)
              <br />
            </>
          )}
          <strong>Note:</strong> Completing the match will finalize the result and record the completion time. The match duration will be calculated automatically from the elapsed time.
        </p>
      </div>
    </Modal>
  );
}
