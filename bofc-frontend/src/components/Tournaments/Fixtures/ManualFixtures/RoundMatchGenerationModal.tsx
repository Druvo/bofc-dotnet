import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { ThunderboltOutlined, CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useGenerateRoundMatchesMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Modal from "../../../ui/modal";
import Button from "../../../ui/button";
import FormInput from "../../../ui/form-input";
import FormSelect from "../../../ui/form-select";
import FormSwitch from "../../../ui/form-switch";
import Alert from "../../../ui/alert";

dayjs.extend(utc);

type FixtureFormat = "SINGLE_ELIMINATION" | "ROUND_ROBIN" | "DOUBLE_ROUND_ROBIN";

interface RoundMatchGenerationModalProps {
  roundId: number | null;
  roundName: string | null;
  teamCount: number;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venues?: Array<{ id: number; name: string }>;
  tournamentVenueId?: number | null;
  tournamentStartDate?: string | null;
}

interface FormValues {
  startDate: string;
  startTime: string;
  matchDurationMinutes: string;
  matchTimeGapMinutes: string;
  venueId: string;
}

export default function RoundMatchGenerationModal({
  roundId,
  roundName,
  teamCount,
  isModalVisible,
  onClose,
  onSuccess,
  venues = [],
  tournamentVenueId,
  tournamentStartDate,
}: RoundMatchGenerationModalProps) {
  const [fixtureFormat, setFixtureFormat] = useState<FixtureFormat>("SINGLE_ELIMINATION");
  const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);
  const [values, setValues] = useState<FormValues>({ startDate: "", startTime: "", matchDurationMinutes: "20", matchTimeGapMinutes: "30", venueId: "" });
  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));

  const [generateMatches, { isLoading }] = useGenerateRoundMatchesMutation();

  useEffect(() => {
    if (isModalVisible) {
      setValues((prev) => {
        const next = { ...prev };
        if (tournamentVenueId) next.venueId = String(tournamentVenueId);
        if (tournamentStartDate) {
          const tournamentDateTime = dayjs.utc(tournamentStartDate).local();
          next.startDate = tournamentDateTime.format("YYYY-MM-DD");
          next.startTime = tournamentDateTime.format("HH:mm");
        }
        return next;
      });
    }
  }, [isModalVisible, tournamentVenueId, tournamentStartDate]);

  const calculateMatchCount = useMemo(() => {
    if (teamCount < 2) return 0;

    switch (fixtureFormat) {
      case "SINGLE_ELIMINATION":
        return Math.floor(teamCount / 2);
      case "ROUND_ROBIN": {
        const singleRoundMatches = (teamCount * (teamCount - 1)) / 2;
        return doubleRoundRobin ? singleRoundMatches * 2 : singleRoundMatches;
      }
      case "DOUBLE_ROUND_ROBIN":
        return teamCount * (teamCount - 1);
      default:
        return 0;
    }
  }, [teamCount, fixtureFormat, doubleRoundRobin]);

  const handleSubmit = async () => {
    if (!roundId) {
      toast.error("No round selected");
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
    if (venues.length > 0 && !values.venueId) {
      toast.error("Please select a venue");
      return;
    }

    const startDateISO = dayjs(`${values.startDate}T${values.startTime}:00`).utc().format("YYYY-MM-DDTHH:mm:ss");

    const payload = {
      roundId,
      fixtureFormat,
      startDate: startDateISO,
      matchTimeGapMinutes: values.matchTimeGapMinutes ? Number(values.matchTimeGapMinutes) : 30,
      matchDurationMinutes: values.matchDurationMinutes ? Number(values.matchDurationMinutes) : 20,
      venueId: values.venueId ? Number(values.venueId) : undefined,
      doubleRoundRobin: fixtureFormat === "ROUND_ROBIN" ? (doubleRoundRobin || false) : undefined,
    };

    try {
      const response = await generateMatches(payload).unwrap();
      toast.success(`Successfully generated ${response.content?.length || 0} matches for ${roundName || "Round"}`);
      setFixtureFormat("SINGLE_ELIMINATION");
      setDoubleRoundRobin(false);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to generate matches:", error);
    }
  };

  const handleCancel = () => {
    setFixtureFormat("SINGLE_ELIMINATION");
    setDoubleRoundRobin(false);
    onClose();
  };

  const matchCount = calculateMatchCount;

  const getFormatDescription = (format: FixtureFormat) => {
    switch (format) {
      case "SINGLE_ELIMINATION":
        return "Bracket format - teams compete in elimination rounds (e.g., 8 teams = 4 QF, 2 SF, 1 Final)";
      case "ROUND_ROBIN":
        return "All teams play each other once (or twice if double round-robin enabled)";
      case "DOUBLE_ROUND_ROBIN":
        return "All teams play each other twice (home and away)";
      default:
        return "";
    }
  };

  return (
    <Modal
      isOpen={isModalVisible}
      onClose={handleCancel}
      title={<span className="flex items-center gap-2"><ThunderboltOutlined className="text-success-500" />Auto-Generate Round Fixtures</span>}
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
        <Alert variant="info" title={`Generating fixtures for: ${roundName || "Round"}`}>
          <div>Teams in round: <strong>{teamCount}</strong></div>
          <div>Matches to be created: <strong>{matchCount}</strong></div>
          <div className="mt-1 text-theme-xs">Format: <strong>{fixtureFormat.replace(/_/g, " ")}</strong></div>
        </Alert>

        {teamCount < 2 && (
          <Alert variant="warning" title="Insufficient Teams">
            At least 2 teams are required to generate matches. Please assign more teams to this round.
          </Alert>
        )}

        <FormSelect
          label={<span className="flex items-center gap-1.5"><ThunderboltOutlined />Fixture Format</span>}
          value={fixtureFormat}
          onChange={(e) => {
            const val = e.target.value as FixtureFormat;
            setFixtureFormat(val);
            if (val !== "ROUND_ROBIN") setDoubleRoundRobin(false);
          }}
          options={[
            { value: "SINGLE_ELIMINATION", label: "Single Elimination (Bracket)" },
            { value: "ROUND_ROBIN", label: "Round Robin" },
          ]}
        />

        <Alert variant="info" title={getFormatDescription(fixtureFormat)} />

        {fixtureFormat === "ROUND_ROBIN" && (
          <div>
            <FormSwitch
              label="Double Round-Robin:"
              checked={doubleRoundRobin}
              onChange={setDoubleRoundRobin}
            />
            <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
              {doubleRoundRobin ? "Each pair of teams plays twice (home and away)" : "Each pair of teams plays once"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormInput type="date" label={<span className="flex items-center gap-1.5"><CalendarOutlined />Start Date</span>} value={values.startDate} onChange={(e) => setField("startDate", e.target.value)} />
          <FormInput type="time" label={<span className="flex items-center gap-1.5"><ClockCircleOutlined />Start Time</span>} value={values.startTime} onChange={(e) => setField("startTime", e.target.value)} />
        </div>

        <FormInput
          type="number"
          label="Match Duration (minutes)"
          min={10}
          max={180}
          step={5}
          value={values.matchDurationMinutes}
          onChange={(e) => setField("matchDurationMinutes", e.target.value)}
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

        {venues && venues.length > 0 && (
          <FormSelect
            label={<span className="flex items-center gap-1.5"><EnvironmentOutlined />Venue</span>}
            placeholder="Select venue"
            value={values.venueId}
            onChange={(e) => setField("venueId", e.target.value)}
            options={venues.map((v) => ({ value: v.id, label: v.name }))}
          />
        )}
      </div>
    </Modal>
  );
}
