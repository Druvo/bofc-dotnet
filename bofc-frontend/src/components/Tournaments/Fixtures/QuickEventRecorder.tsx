import React, { useState } from "react";
import { toast } from "react-toastify";
import { ThunderboltOutlined, UserOutlined } from "@ant-design/icons";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { useRecordMatchEventMutation } from "../../../state/features/fixtures/fixturesSlice";
import moment from "moment";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormSelect from "../../ui/form-select";
import FormInput from "../../ui/form-input";

interface QuickEventRecorderProps {
  matchId: number;
  fixture: IFixture | null;
  homeTeamPlayers?: Array<{ id: number; name: string }>;
  awayTeamPlayers?: Array<{ id: number; name: string }>;
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  { value: "GOAL", label: "Goal", icon: "⚽", color: "#52c41a" },
  { value: "YELLOW_CARD", label: "Yellow Card", icon: "🟨", color: "#faad14" },
  { value: "RED_CARD", label: "Red Card", icon: "🟥", color: "#f5222d" },
  { value: "SUBSTITUTION", label: "Substitution", icon: "🔄", color: "#722ed1" },
  { value: "INJURY", label: "Injury", icon: "🤕", color: "#fa8c16" },
];

export default function QuickEventRecorder({
  matchId,
  fixture,
  homeTeamPlayers = [],
  awayTeamPlayers = [],
  onSuccess,
}: QuickEventRecorderProps) {
  const [recordEvent, { isLoading }] = useRecordMatchEventMutation();
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [assistPlayerId, setAssistPlayerId] = useState<number | null>(null);
  const [manualEventMinute, setManualEventMinute] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmNoAssistOpen, setConfirmNoAssistOpen] = useState(false);

  const calculateElapsedTime = (): number => {
    if (!fixture) return 0;

    let elapsedSeconds = 0;

    if (fixture.matchStatus === "ONGOING" && fixture.startedAt) {
      const startTime = moment.utc(fixture.startedAt).local().valueOf();
      const now = Date.now();
      const timeSinceStart = Math.floor((now - startTime) / 1000);
      elapsedSeconds = (fixture.elapsedTimeSeconds || 0) + timeSinceStart;
    } else if (fixture.matchStatus === "PAUSED" || fixture.matchStatus === "COMPLETED") {
      elapsedSeconds = fixture.elapsedTimeSeconds || 0;
    }

    const cappedSeconds = Math.min(elapsedSeconds, 7200);
    return Math.floor(cappedSeconds / 60);
  };

  const handleEventTypeClick = (eventType: string) => {
    setSelectedEventType(eventType);
    setModalVisible(true);
  };

  const handleRecordEvent = async () => {
    if (!selectedEventType || !selectedTeamId || !selectedPlayerId) {
      toast.error("Please select event type, team, and player");
      return;
    }

    if (selectedEventType === "GOAL" && !assistPlayerId) {
      setConfirmNoAssistOpen(true);
      return;
    }

    await submitEvent();
  };

  const submitEvent = async () => {
    try {
      const currentMinute = calculateElapsedTime();
      const resolvedMinute =
        manualEventMinute == null
          ? currentMinute
          : Math.max(0, Math.min(150, Math.floor(manualEventMinute)));

      await recordEvent({
        matchId,
        eventType: selectedEventType!,
        playerId: selectedPlayerId!,
        teamId: selectedTeamId!,
        eventTime: resolvedMinute,
        relatedPlayerId: assistPlayerId || undefined,
      }).unwrap();

      toast.success("Event recorded successfully");
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to record event:", error);
      toast.error(error?.data?.message || "Failed to record event");
    }
  };

  const resetForm = () => {
    setSelectedEventType(null);
    setSelectedTeamId(null);
    setSelectedPlayerId(null);
    setAssistPlayerId(null);
    setManualEventMinute(null);
    setModalVisible(false);
    setConfirmNoAssistOpen(false);
  };

  const currentTeamPlayers =
    selectedTeamId === fixture?.homeTeamId
      ? homeTeamPlayers
      : selectedTeamId === fixture?.awayTeamId
      ? awayTeamPlayers
      : [];

  const selectedEvent = EVENT_TYPES.find((e) => e.value === selectedEventType);

  if (!fixture) {
    return <p className="py-5 text-theme-sm text-gray-400 dark:text-gray-500">No fixture data available</p>;
  }

  const isScheduled = fixture.matchStatus === "SCHEDULED";

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <span className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white/90">
            <ThunderboltOutlined /> Quick Event Recording
          </span>
          <span className="text-theme-sm font-semibold text-gray-500 dark:text-gray-400">{calculateElapsedTime()}'</span>
        </div>

        {isScheduled && (
          <div className="mb-4 rounded-lg border border-warning-500/30 bg-warning-50 px-4 py-3 dark:bg-warning-500/10">
            <p className="text-theme-sm text-warning-700 dark:text-orange-300">
              Event recording is disabled. Events can only be recorded during or after the match.
            </p>
          </div>
        )}

        <p className="mb-3 text-theme-sm text-gray-400 dark:text-gray-500">Click on an event type to quickly record it</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EVENT_TYPES.map((event) => (
            <button
              key={event.value}
              type="button"
              disabled={isScheduled}
              onClick={() => handleEventTypeClick(event.value)}
              className="flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: `${event.color}30`, background: isScheduled ? undefined : `${event.color}08` }}
            >
              <span className="text-2xl">{event.icon}</span>
              <span className="text-theme-xs font-semibold" style={{ color: isScheduled ? undefined : event.color }}>{event.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal
        isOpen={modalVisible}
        onClose={resetForm}
        title={
          <span className="flex items-center gap-3">
            <span className="text-3xl">{selectedEvent?.icon}</span>
            <span>
              <span className="block text-lg font-semibold" style={{ color: selectedEvent?.color }}>Record {selectedEvent?.label}</span>
              <span className="block text-theme-xs text-gray-400">Match Time: {calculateElapsedTime()}'</span>
            </span>
          </span>
        }
        className="max-w-[500px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedTeamId || !selectedPlayerId || isLoading}
              onClick={handleRecordEvent}
            >
              {selectedEventType === "GOAL" && !assistPlayerId ? "Record Goal (No Assist)" : "Record Event"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">Select Team *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedTeamId(fixture.homeTeamId); setSelectedPlayerId(null); }}
                className={`h-[60px] rounded-xl font-semibold ${selectedTeamId === fixture.homeTeamId ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"}`}
              >
                {fixture.homeTeamName}
              </button>
              <button
                type="button"
                onClick={() => { setSelectedTeamId(fixture.awayTeamId); setSelectedPlayerId(null); }}
                className={`h-[60px] rounded-xl font-semibold ${selectedTeamId === fixture.awayTeamId ? "bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-white" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"}`}
              >
                {fixture.awayTeamName}
              </button>
            </div>
          </div>

          <FormSelect
            label={<span className="flex items-center gap-1.5"><UserOutlined />{selectedEventType === "GOAL" ? "Select Goal Scorer *" : "Select Player *"}</span>}
            placeholder={selectedEventType === "GOAL" ? "Choose goal scorer" : "Choose a player"}
            value={selectedPlayerId ?? ""}
            disabled={!selectedTeamId || currentTeamPlayers.length === 0}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : null;
              setSelectedPlayerId(value);
              if (selectedEventType === "GOAL") setAssistPlayerId(null);
            }}
            options={currentTeamPlayers.map((p) => ({ value: p.id, label: p.name }))}
          />

          {selectedEventType === "GOAL" && selectedPlayerId && (
            <div>
              <FormSelect
                label="🎯 Select Assist Player (Optional)"
                placeholder="Choose assist player (optional)"
                value={assistPlayerId ?? ""}
                onChange={(e) => setAssistPlayerId(e.target.value ? Number(e.target.value) : null)}
                options={currentTeamPlayers.filter((p) => p.id !== selectedPlayerId).map((p) => ({ value: p.id, label: p.name }))}
              />
              <p className="mt-1 text-theme-xs text-gray-400">Select the player who provided the assist for this goal</p>
            </div>
          )}

          <FormInput
            type="number"
            label="Event Minute (Optional)"
            min={0}
            max={150}
            step={1}
            value={manualEventMinute ?? ""}
            onChange={(e) => setManualEventMinute(e.target.value ? Number(e.target.value) : null)}
            placeholder={`Auto (${calculateElapsedTime()}')`}
            hint="Leave empty to use current match minute automatically."
          />
        </div>
      </Modal>

      <Modal
        isOpen={confirmNoAssistOpen}
        onClose={() => setConfirmNoAssistOpen(false)}
        title="No Assist Recorded"
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmNoAssistOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={() => { setConfirmNoAssistOpen(false); submitEvent(); }}>Record Without Assist</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">No assist player selected. Do you want to record the goal without an assist?</p>
      </Modal>
    </>
  );
}
