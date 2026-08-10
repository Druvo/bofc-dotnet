import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ThunderboltOutlined, CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useGenerateGroupMatchesMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { GroupFormat, FixtureFormat } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetMatchDaySummaryQuery } from "../../../../state/features/matchDays/matchDaysSlice";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Modal from "../../../ui/modal";
import Button from "../../../ui/button";
import FormInput from "../../../ui/form-input";
import FormSelect from "../../../ui/form-select";
import Alert from "../../../ui/alert";

dayjs.extend(utc);

interface GroupMatchGenerationModalProps {
  matchDayId: number;
  groupId: number | null;
  groupName: string | null;
  teamCount: number;
  groupFormat?: GroupFormat;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venues?: Array<{ id: number; name: string }>;
}

interface FormValues {
  startDate: string;
  startTime: string;
  matchTimeGapMinutes: string;
  matchDurationMinutes: string;
  venueId: string;
}

const getFixtureFormatFromGroupFormat = (format?: GroupFormat): FixtureFormat => {
  if (!format) return "ROUND_ROBIN";
  switch (format) {
    case GroupFormat.ROUND_ROBIN_DOUBLE:
      return "DOUBLE_ROUND_ROBIN";
    case GroupFormat.ROUND_ROBIN_SINGLE:
      return "ROUND_ROBIN";
    default:
      return "ROUND_ROBIN";
  }
};

export default function GroupMatchGenerationModal({
  matchDayId,
  groupId,
  groupName,
  teamCount,
  groupFormat,
  isModalVisible,
  onClose,
  onSuccess,
  venues = [],
}: GroupMatchGenerationModalProps) {
  const { data: matchDaySummary } = useGetMatchDaySummaryQuery({ matchDayId }, { skip: !matchDayId });
  const matchDayDate = matchDaySummary?.content?.[0]?.matchDayDate;
  const matchDayVenueName = matchDaySummary?.content?.[0]?.venueName;

  const fixtureFormat = getFixtureFormatFromGroupFormat(groupFormat);

  const [values, setValues] = useState<FormValues>({ startDate: "", startTime: "", matchTimeGapMinutes: "180", matchDurationMinutes: "90", venueId: "" });
  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (isModalVisible) {
      // matchDayDate is naive-local already - see RoundManagement.tsx's identical fix.
      const defaultStartDateTime = matchDayDate ? dayjs(matchDayDate) : dayjs().add(1, "day").hour(15).minute(0);
      const matchDayVenue = venues.find((v) => v.name === matchDayVenueName);

      setValues({
        startDate: defaultStartDateTime.format("YYYY-MM-DD"),
        startTime: defaultStartDateTime.format("HH:mm"),
        matchTimeGapMinutes: "180",
        matchDurationMinutes: "90",
        venueId: matchDayVenue ? String(matchDayVenue.id) : "",
      });
    }
  }, [isModalVisible, groupFormat, matchDayDate, matchDayVenueName, venues]);

  const [generateMatches, { isLoading }] = useGenerateGroupMatchesMutation();

  const calculateMatchCount = () => {
    if (teamCount < 2) return 0;
    const singleRoundMatches = (teamCount * (teamCount - 1)) / 2;
    return fixtureFormat === "DOUBLE_ROUND_ROBIN" ? singleRoundMatches * 2 : singleRoundMatches;
  };

  const handleSubmit = async () => {
    if (!groupId) {
      toast.error("No group selected");
      return;
    }
    if (teamCount < 2) {
      toast.error("At least 2 teams required to generate matches");
      return;
    }
    if (!values.startDate || !values.startTime) {
      toast.error("Please select both start date and time");
      return;
    }

    const startDateISO = dayjs(`${values.startDate}T${values.startTime}:00`).utc().format("YYYY-MM-DDTHH:mm:ss");

    const payload = {
      groupId,
      fixtureFormat,
      startDate: startDateISO,
      matchTimeGapMinutes: values.matchTimeGapMinutes ? Number(values.matchTimeGapMinutes) : 180,
      matchDurationMinutes: values.matchDurationMinutes ? Number(values.matchDurationMinutes) : 90,
      venueId: values.venueId ? Number(values.venueId) : undefined,
    };

    try {
      const response = await generateMatches(payload).unwrap();
      toast.success(`Successfully generated ${response.content?.length || 0} matches for ${groupName}`);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to generate matches:", error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const matchCount = calculateMatchCount();

  return (
    <Modal
      isOpen={isModalVisible}
      onClose={handleCancel}
      title={<span className="flex items-center gap-2"><ThunderboltOutlined className="text-success-500" />Auto-Generate Group Fixtures</span>}
      className="max-w-[600px]"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button type="button" size="sm" startIcon={<ThunderboltOutlined />} disabled={isLoading || teamCount < 2} onClick={handleSubmit}>
            Generate {matchCount} Matches
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Alert variant="info" title={`Generating fixtures for: ${groupName || "Group"}`}>
          <div>Teams in group: <strong>{teamCount}</strong></div>
          <div>Matches to be created: <strong>{matchCount}</strong> ({fixtureFormat === "DOUBLE_ROUND_ROBIN" ? "Double Round-Robin" : "Single Round-Robin"})</div>
          <div>Default venue: <strong>{matchDayVenueName || "Not set"}</strong></div>
        </Alert>

        {teamCount < 2 && (
          <Alert variant="warning" title="Insufficient Teams">
            At least 2 teams are required to generate matches. Please assign more teams to this group.
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormInput type="date" label={<span className="flex items-center gap-1.5"><CalendarOutlined />Start Date</span>} value={values.startDate} onChange={(e) => setField("startDate", e.target.value)} />
          <FormInput type="time" label={<span className="flex items-center gap-1.5"><ClockCircleOutlined />Start Time</span>} value={values.startTime} onChange={(e) => setField("startTime", e.target.value)} />
        </div>

        <FormSelect
          label={<span className="flex items-center gap-1.5"><ClockCircleOutlined />Match Format</span>}
          value={fixtureFormat}
          disabled
          options={[
            { value: "ROUND_ROBIN", label: "Round Robin - each pair plays once" },
            { value: "DOUBLE_ROUND_ROBIN", label: "Double Round Robin - each pair plays twice" },
          ]}
        />

        <FormInput
          type="number"
          label="Time Gap Between Matches (minutes)"
          hint="Time interval between the end of one match and the start of the next"
          min={5}
          max={1440}
          step={5}
          value={values.matchTimeGapMinutes}
          onChange={(e) => setField("matchTimeGapMinutes", e.target.value)}
        />

        <FormInput
          type="number"
          label="Match Duration (minutes)"
          min={10}
          max={180}
          step={5}
          value={values.matchDurationMinutes}
          onChange={(e) => setField("matchDurationMinutes", e.target.value)}
        />

        {venues && venues.length > 0 && (
          <FormSelect
            label="Venue (Optional)"
            placeholder="Select venue (optional)"
            value={values.venueId}
            onChange={(e) => setField("venueId", e.target.value)}
            options={venues.map((v) => ({ value: v.id, label: v.name }))}
          />
        )}

        <Alert variant="success" title="Match Generation Info">
          <ul className="list-disc pl-5">
            <li>Matches will be created in round-robin format</li>
            <li>All matches will start with status: SCHEDULED</li>
            <li>You can edit individual matches after generation</li>
            <li>Standings will auto-update when matches are completed</li>
          </ul>
        </Alert>
      </div>
    </Modal>
  );
}
