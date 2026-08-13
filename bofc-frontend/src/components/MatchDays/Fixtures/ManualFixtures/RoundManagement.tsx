import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  TrophyOutlined,
  DeleteOutlined,
  SaveOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  useCreateRoundMutation,
  useUpdateRoundMutation,
  useDeleteRoundMutation,
  useGetRoundByIdQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { useGetMatchDaySummaryQuery } from "../../../../state/features/matchDays/matchDaysSlice";
import {
  RoundType,
  MatchDayRoundResponse,
} from "../../../../state/features/manualFixtures/manualFixtureTypes";
import Modal from "../../../ui/modal";
import Button from "../../../ui/button";
import FormInput from "../../../ui/form-input";
import FormSelect from "../../../ui/form-select";
import Alert from "../../../ui/alert";

dayjs.extend(utc);

interface RoundManagementProps {
  matchDayId: number;
  roundId: number | null;
  createContext?: {
    sourceRoundName?: string;
    sourceGroupName?: string;
    suggestedRoundName?: string;
    suggestedRoundType?: RoundType;
  } | null;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingRounds: MatchDayRoundResponse[];
}

const ROUND_TYPE_OPTIONS = [
  { value: RoundType.GROUP_BASED, label: "Group Based" },
  { value: RoundType.DIRECT_KNOCKOUT, label: "Direct Knockout" },
];

interface FormValues {
  roundName: string;
  roundType: RoundType;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  advancementRule: string;
}

const emptyValues: FormValues = {
  roundName: "",
  roundType: RoundType.GROUP_BASED,
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  advancementRule: "",
};

export default function RoundManagement({
  matchDayId,
  roundId,
  createContext,
  isModalVisible,
  onClose,
  onSuccess,
  existingRounds,
}: RoundManagementProps) {
  const isEditing = roundId !== null;
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [error, setError] = useState<string | undefined>();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [createRound, { isLoading: isCreating }] = useCreateRoundMutation();
  const [updateRound, { isLoading: isUpdating }] = useUpdateRoundMutation();
  const [deleteRound, { isLoading: isDeleting }] = useDeleteRoundMutation();

  const { data: roundData } = useGetRoundByIdQuery(
    { roundId: roundId! },
    { skip: !roundId || !isModalVisible, refetchOnFocus: false, refetchOnMountOrArgChange: false }
  );
  const existingRound = roundData?.content;

  const { data: matchDaySummary } = useGetMatchDaySummaryQuery({ matchDayId }, { skip: !matchDayId });
  const matchDayDate = matchDaySummary?.content?.[0]?.matchDayDate;

  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (isModalVisible && existingRound) {
      const start = existingRound.startDate ? dayjs.utc(existingRound.startDate).local() : null;
      const end = existingRound.endDate ? dayjs.utc(existingRound.endDate).local() : null;
      setValues({
        roundName: existingRound.roundName,
        roundType: existingRound.roundType,
        startDate: start ? start.format("YYYY-MM-DD") : "",
        startTime: start ? start.format("HH:mm") : "",
        endDate: end ? end.format("YYYY-MM-DD") : "",
        endTime: end ? end.format("HH:mm") : "",
        advancementRule: existingRound.advancementRule || "",
      });
    } else if (isModalVisible && !isEditing) {
      // matchDayDate is naive-local already (Dhaka wall-clock, see utils.ts's showBdLocalTime
      // doc comment) - no .utc()/.local() conversion, or this pre-fill silently disagrees with
      // every other screen reading the same MatchDay.
      const tdt = matchDayDate ? dayjs(matchDayDate) : null;
      setValues({
        ...emptyValues,
        roundName: createContext?.suggestedRoundName || "",
        roundType: createContext?.suggestedRoundType || RoundType.GROUP_BASED,
        startDate: tdt ? tdt.format("YYYY-MM-DD") : "",
        startTime: tdt ? tdt.format("HH:mm") : "",
      });
    }
    if (!isModalVisible) {
      setValues(emptyValues);
      setError(undefined);
    }
  }, [isModalVisible, existingRound, isEditing, matchDayDate, createContext]);

  const handleSubmit = async () => {
    if (!values.roundName.trim()) {
      setError("Please enter round name");
      return;
    }
    if (values.advancementRule.trim()) {
      try {
        JSON.parse(values.advancementRule);
      } catch {
        setError("Advancement rule must be valid JSON");
        return;
      }
    }
    setError(undefined);

    let roundNumber: number;
    let sequenceOrder: number;

    if (isEditing && existingRound) {
      roundNumber = existingRound.roundNumber;
      sequenceOrder = existingRound.sequenceOrder;
    } else {
      const maxSequence = existingRounds.length > 0 ? Math.max(...existingRounds.map((r) => r.sequenceOrder)) : 0;
      const maxRoundNumber = existingRounds.length > 0 ? Math.max(...existingRounds.map((r) => r.roundNumber)) : 0;
      roundNumber = maxRoundNumber + 1;
      sequenceOrder = maxSequence + 1;
    }

    let startDateUTC: string | undefined;
    let endDateUTC: string | undefined;
    if (values.startDate && values.startTime) {
      startDateUTC = dayjs(`${values.startDate}T${values.startTime}:00`).utc().format("YYYY-MM-DDTHH:mm:ss");
    }
    if (values.endDate && values.endTime) {
      endDateUTC = dayjs(`${values.endDate}T${values.endTime}:00`).utc().format("YYYY-MM-DDTHH:mm:ss");
    }

    const payload = {
      matchDayId,
      roundNumber,
      roundName: values.roundName,
      roundType: values.roundType,
      sequenceOrder,
      advancementRule: values.advancementRule || undefined,
      startDate: startDateUTC,
      endDate: endDateUTC,
    };

    try {
      if (isEditing) {
        await updateRound({ roundId: roundId!, ...payload }).unwrap();
        toast.success("Round updated successfully");
      } else {
        await createRound(payload).unwrap();
        toast.success("Round created successfully");
      }
      setValues(emptyValues);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save round:", error);
    }
  };

  const handleDelete = async () => {
    if (!roundId) return;
    try {
      await deleteRound({ roundId }).unwrap();
      toast.success("Round deleted successfully");
      setValues(emptyValues);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to delete round:", error);
    }
    setConfirmDeleteOpen(false);
  };

  const handleCancel = () => {
    setValues(emptyValues);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isModalVisible}
        onClose={handleCancel}
        title={<span className="flex items-center gap-2"><TrophyOutlined className="text-brand-500" />{isEditing ? "Edit Round" : "Create New Round"}</span>}
        className="max-w-[700px]"
        footer={
          <div className="flex w-full items-center justify-between">
            {isEditing ? (
              <Button type="button" variant="danger" size="sm" startIcon={<DeleteOutlined />} disabled={isDeleting} onClick={() => setConfirmDeleteOpen(true)}>
                Delete
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button type="button" size="sm" startIcon={<SaveOutlined />} disabled={isCreating || isUpdating} onClick={handleSubmit}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Alert variant="info" title="Round Configuration">
            Rounds organize your Match Day into stages. Each round can contain groups (Group Stage) or teams directly (Knockout rounds).
          </Alert>

          {!isEditing && createContext?.sourceRoundName && (
            <Alert variant="success" title="Create From Context">
              Source: {createContext.sourceRoundName}{createContext.sourceGroupName ? ` -> ${createContext.sourceGroupName}` : ""}. You can adjust name/type before creating.
            </Alert>
          )}

          <FormInput label="Round Name" placeholder="e.g., Group Stage, Quarter Finals, Semi Finals" value={values.roundName} onChange={(e) => setField("roundName", e.target.value)} error={error} />

          <FormSelect label="Round Type" value={values.roundType} onChange={(e) => setField("roundType", e.target.value as RoundType)} options={ROUND_TYPE_OPTIONS} />

          <div className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Scheduling (Optional)</div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput type="date" label={<span className="flex items-center gap-1.5"><CalendarOutlined />Start Date</span>} value={values.startDate} onChange={(e) => setField("startDate", e.target.value)} />
            <FormInput type="time" label={<span className="flex items-center gap-1.5"><ClockCircleOutlined />Start Time</span>} value={values.startTime} onChange={(e) => setField("startTime", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput type="date" label={<span className="flex items-center gap-1.5"><CalendarOutlined />End Date</span>} value={values.endDate} onChange={(e) => setField("endDate", e.target.value)} />
            <FormInput type="time" label={<span className="flex items-center gap-1.5"><ClockCircleOutlined />End Time</span>} value={values.endTime} onChange={(e) => setField("endTime", e.target.value)} />
          </div>

          <div className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Advanced (Optional)</div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Advancement Rule (JSON)</label>
            <textarea
              rows={3}
              placeholder='{"topN": 2, "criteria": "points"}'
              value={values.advancementRule}
              onChange={(e) => setField("advancementRule", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 font-mono text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete Round?"
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this round? This action cannot be undone.</p>
      </Modal>
    </>
  );
}
