import React, { useState } from "react";
import { toast } from "react-toastify";
import { PlayCircleOutlined, CheckCircleOutlined, SettingOutlined } from "@ant-design/icons";
import {
  useStartMatchMutation,
  useCompleteMatchMutation,
} from "../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import StartMatchModal from "./StartMatchModal";
import CompleteMatchModal from "./CompleteMatchModal";
import { Dropdown, DropdownItem } from "../../ui/dropdown";
import Badge from "../../ui/badge";

interface MatchLivePanelProps {
  fixture: IFixture;
  onSuccess?: () => void;
  compact?: boolean;
}

const statusBadgeVariant: Record<string, "info" | "warning" | "primary" | "success" | "light"> = {
  SCHEDULED: "info",
  ONGOING: "warning",
  PAUSED: "primary",
  COMPLETED: "success",
};

export default function MatchLivePanel({
  fixture,
  onSuccess,
  compact = false,
}: MatchLivePanelProps) {
  const [startMatch, { isLoading: startLoading }] = useStartMatchMutation();
  const [completeMatch, { isLoading: completeLoading }] = useCompleteMatchMutation();
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);

  const handleStartConfirm = async (venueId?: number, matchDurationMinutes?: number) => {
    try {
      await startMatch({
        matchId: fixture.id,
        venueId,
        matchDurationMinutes,
      }).unwrap();

      toast.success("Match started successfully");
      setStartModalVisible(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to start match");
    }
  };

  const handleCompleteConfirm = async (matchDurationMinutes?: number) => {
    try {
      const calculatedDuration = matchDurationMinutes ||
        (fixture.elapsedTimeSeconds
          ? Math.min(Math.ceil(fixture.elapsedTimeSeconds / 60), 120)
          : Math.min(fixture.matchDurationMinutes || 90, 120));

      await completeMatch({
        matchId: fixture.id,
        matchDurationMinutes: calculatedDuration,
      }).unwrap();

      toast.success("Match completed successfully");
      setCompleteModalVisible(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to complete match");
    }
  };

  const menuItems = (close: () => void) => (
    <>
      {fixture.matchStatus === "SCHEDULED" && (
        <DropdownItem onClick={() => { close(); setStartModalVisible(true); }}>
          <PlayCircleOutlined /> Start Match
        </DropdownItem>
      )}
      {fixture.matchStatus === "ONGOING" && (
        <DropdownItem className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10" onClick={() => { close(); setCompleteModalVisible(true); }}>
          <CheckCircleOutlined /> Complete Match
        </DropdownItem>
      )}
      {fixture.matchStatus === "COMPLETED" && (
        <DropdownItem className="cursor-not-allowed opacity-50">Match is already completed</DropdownItem>
      )}
    </>
  );

  if (compact) {
    return (
      <>
        <Dropdown
          align="right"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="flex h-12 items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-5 font-semibold text-white backdrop-blur"
            >
              <Badge variant={statusBadgeVariant[fixture.matchStatus] || "light"}>{fixture.matchStatus}</Badge>
              <SettingOutlined /> Match Settings
            </button>
          )}
        >
          {(close) => menuItems(close)}
        </Dropdown>

        <StartMatchModal
          open={startModalVisible}
          fixture={fixture}
          onCancel={() => setStartModalVisible(false)}
          onConfirm={handleStartConfirm}
          isLoading={startLoading}
        />

        <CompleteMatchModal
          open={completeModalVisible}
          fixture={fixture}
          onCancel={() => setCompleteModalVisible(false)}
          onConfirm={handleCompleteConfirm}
          isLoading={completeLoading}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-base font-bold text-gray-800 dark:text-white/90">Match Controls</h5>
          <Dropdown
            align="right"
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-theme-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300">
                <SettingOutlined /> Match Settings
              </button>
            )}
          >
            {(close) => menuItems(close)}
          </Dropdown>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-theme-sm font-semibold text-gray-500 dark:text-gray-400">Current Status:</span>
          <Badge variant={statusBadgeVariant[fixture.matchStatus] || "light"}>{fixture.matchStatus}</Badge>
        </div>
      </div>

      <StartMatchModal
        open={startModalVisible}
        fixture={fixture}
        onCancel={() => setStartModalVisible(false)}
        onConfirm={handleStartConfirm}
        isLoading={startLoading}
      />

      <CompleteMatchModal
        open={completeModalVisible}
        fixture={fixture}
        onCancel={() => setCompleteModalVisible(false)}
        onConfirm={handleCompleteConfirm}
        isLoading={completeLoading}
      />
    </>
  );
}
