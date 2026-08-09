import React, { useState, useEffect } from "react";
import { PlayCircleOutlined, EnvironmentOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import IVenue from "../../../interfaces/IVenue";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormSelect from "../../ui/form-select";
import FormInput from "../../ui/form-input";

interface StartMatchModalProps {
  open: boolean;
  fixture: IFixture;
  onCancel: () => void;
  onConfirm: (venueId?: number, matchDurationMinutes?: number) => Promise<void>;
  isLoading?: boolean;
}

export default function StartMatchModal({
  open,
  fixture,
  onCancel,
  onConfirm,
  isLoading = false,
}: StartMatchModalProps) {
  const { data: venuesData, isLoading: venuesLoading } = useGetVanuesQuery();
  const venues = venuesData?.content || [];

  const [venueId, setVenueId] = useState<string>("");
  const [duration, setDuration] = useState<string>("90");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setVenueId(fixture.venueId ? String(fixture.venueId) : "");
      setDuration(String(fixture.matchDurationMinutes || 90));
      setError(undefined);
    }
  }, [open, fixture]);

  const handleOk = async () => {
    if (!venueId) {
      setError("Please select a venue");
      return;
    }
    const durationNum = Number(duration);
    if (!duration || durationNum < 10 || durationNum > 120) {
      setError("Duration must be between 10 and 120 minutes");
      return;
    }
    try {
      await onConfirm(Number(venueId), durationNum);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title={<span className="flex items-center gap-2"><PlayCircleOutlined className="text-success-500" />Start Match</span>}
      className="max-w-[500px]"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="button" size="sm" startIcon={<PlayCircleOutlined />} disabled={isLoading} onClick={handleOk}>Start Match</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormSelect
          label={<span className="flex items-center gap-1.5"><EnvironmentOutlined />Venue</span>}
          placeholder="Select venue"
          disabled={venuesLoading}
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          error={error && !venueId ? error : undefined}
          options={venues.filter((v: IVenue) => v.active).map((venue: IVenue) => ({ value: venue.id, label: venue.name }))}
        />

        <FormInput
          type="number"
          label={<span className="flex items-center gap-1.5"><ClockCircleOutlined />Match Duration (minutes)</span>}
          placeholder="e.g., 90"
          min={10}
          max={120}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          error={error && venueId ? error : undefined}
        />

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            <strong>Match:</strong> {fixture.homeTeamName} vs {fixture.awayTeamName}
            <br />
            <strong>Venue:</strong> {venues.find((v: IVenue) => v.id === fixture.venueId)?.name || "Not set, Please set venue in matches list"}
            <br />
            <strong>Note:</strong> The match will start immediately after confirmation. The start time will be recorded automatically.
          </p>
        </div>
      </div>
    </Modal>
  );
}
