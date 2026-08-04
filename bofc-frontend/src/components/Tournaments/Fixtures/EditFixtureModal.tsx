import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CalendarOutlined, ArrowRightOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useUpdateFixtureMutation } from "../../../state/features/fixtures/fixturesSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import Loader from "../../ui/loader";

dayjs.extend(utc);

interface EditFixtureModalProps {
  fixture: IFixture | null;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  onSuccess?: () => void;
}

export default function EditFixtureModal({
  fixture,
  isModalVisible,
  handleSetIsModalVisible,
  onSuccess,
}: EditFixtureModalProps) {
  const [updateFixture, { isLoading }] = useUpdateFixtureMutation();
  const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
  const [newDateStr, setNewDateStr] = useState("");
  const [newTimeStr, setNewTimeStr] = useState("");
  const [newVenueId, setNewVenueId] = useState<number | null>(null);
  const [venueError, setVenueError] = useState<string | undefined>();

  const venues = venuesData?.content || [];

  const currentDateTime = fixture?.matchDate ? dayjs.utc(fixture.matchDate).local() : null;

  useEffect(() => {
    if (fixture && isModalVisible) {
      const currentLocal = fixture.matchDate ? dayjs.utc(fixture.matchDate).local() : null;
      setNewDateStr(currentLocal ? currentLocal.format("YYYY-MM-DD") : "");
      setNewTimeStr(currentLocal ? currentLocal.format("HH:mm") : "");
      setNewVenueId(fixture.venueId);
      setVenueError(undefined);
    }
  }, [fixture, isModalVisible]);

  const handleOk = async () => {
    if (!fixture) {
      toast.error("No fixture data available");
      return;
    }
    if (!newVenueId) {
      setVenueError("Please select a venue");
      return;
    }
    if (!newDateStr || !newTimeStr) {
      toast.error("Please select both date and time");
      return;
    }

    const localDateTime = dayjs(`${newDateStr}T${newTimeStr}:00`);

    try {
      await updateFixture({
        matchId: fixture.id,
        matchDate: localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss"),
        venueId: newVenueId,
      }).unwrap();

      toast.success("Fixture updated successfully");
      handleSetIsModalVisible(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update fixture:", error);
      toast.error("Failed to update fixture");
    }
  };

  const handleCancel = () => {
    handleSetIsModalVisible(false);
  };

  const getVenueName = (venueId: number | null) => {
    if (!venueId) return "Not set";
    const venue = venues.find((v: any) => v.id === venueId);
    return venue?.name || "Unknown";
  };

  const newDate = newDateStr ? dayjs(newDateStr) : null;
  const newTime = newTimeStr ? dayjs(`2000-01-01T${newTimeStr}`) : null;

  const hasDateTimeChanges = newDate && newTime && currentDateTime && (
    newDateStr !== currentDateTime.format("YYYY-MM-DD") ||
    newTimeStr !== currentDateTime.format("HH:mm")
  );
  const hasVenueChanges = newVenueId !== null && newVenueId !== fixture?.venueId;
  const hasChanges = hasDateTimeChanges || hasVenueChanges;

  if (!fixture) return null;

  return (
    <Modal
      isOpen={isModalVisible}
      onClose={handleCancel}
      title={`Edit Fixture: ${fixture.homeTeamName} vs ${fixture.awayTeamName}`}
      className="max-w-[600px]"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleOk}>Update</Button>
        </>
      }
    >
      {isVenuesLoading ? (
        <Loader className="py-6" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <div className="mb-2 flex items-center gap-1.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              <CalendarOutlined /> Current Match Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-theme-xs text-gray-400">Current Date & Time:</div>
                <div className="mt-1 font-semibold text-gray-800 dark:text-white/90">{currentDateTime ? currentDateTime.format("YYYY-MM-DD h:mm A") : "Not set"}</div>
              </div>
              <div>
                <div className="text-theme-xs text-gray-400">Current Venue:</div>
                <div className="mt-1 font-semibold text-gray-800 dark:text-white/90">{getVenueName(fixture.venueId)}</div>
              </div>
            </div>
          </div>

          <div className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Update Match Details</div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput type="date" label={<span className="flex items-center gap-1.5"><CalendarOutlined />Match Date</span>} value={newDateStr} onChange={(e) => setNewDateStr(e.target.value)} />
            <FormInput type="time" label={<span className="flex items-center gap-1.5"><ClockCircleOutlined />Match Time</span>} value={newTimeStr} onChange={(e) => setNewTimeStr(e.target.value)} />
          </div>

          <FormSelect
            label="Venue"
            placeholder="Select a venue"
            value={newVenueId ?? ""}
            onChange={(e) => setNewVenueId(Number(e.target.value))}
            error={venueError}
            options={venues.map((v: any) => ({ value: v.id, label: v.name }))}
          />

          {hasChanges && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Preview Changes</div>
              {hasDateTimeChanges && newDate && newTime && (
                <div className="mb-2">
                  <div className="text-theme-xs text-gray-400">Date & Time:</div>
                  <div className="mt-1 flex items-center gap-2 text-theme-sm">
                    <span className="text-gray-400 line-through">{currentDateTime?.format("YYYY-MM-DD h:mm A")}</span>
                    <ArrowRightOutlined className="text-gray-400" />
                    <span className="font-semibold text-success-600 dark:text-success-500">{newDateStr} {newTime.format("h:mm A")}</span>
                  </div>
                </div>
              )}
              {newVenueId !== null && newVenueId !== fixture.venueId && (
                <div>
                  <div className="text-theme-xs text-gray-400">Venue:</div>
                  <div className="mt-1 flex items-center gap-2 text-theme-sm">
                    <span className="text-gray-400 line-through">{getVenueName(fixture.venueId)}</span>
                    <ArrowRightOutlined className="text-gray-400" />
                    <span className="font-semibold text-success-600 dark:text-success-500">{getVenueName(newVenueId)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
