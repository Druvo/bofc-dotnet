import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { ThunderboltOutlined } from "@ant-design/icons";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { useCreateMatchDayMutation } from "../../../state/features/matchDays/matchDaysSlice";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";

const WEEKDAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

interface FormValues {
  month: string; // YYYY-MM
  weekday: string; // 0-6, dayjs .day() convention
  time: string; // HH:mm
  durationMinutes: string;
  venueId: string;
  namePrefix: string;
}

const emptyValues: FormValues = {
  month: dayjs().format("YYYY-MM"),
  weekday: "3", // Wednesday - the club's standing match day (see notification/dashboard copy elsewhere)
  time: "18:00",
  durationMinutes: "90",
  venueId: "",
  namePrefix: "Match Day",
};

/**
 * Bulk-creates one Match Day per matching weekday in a chosen month (e.g. every
 * Wednesday in September), instead of clicking "+ New Match Day" once per date.
 * Reuses the same createMatchDay mutation CreateMatchDayModal.tsx uses for a
 * single entry - just looped, so it inherits the same validation/persistence
 * path rather than a separate bulk backend endpoint.
 */
export default function GenerateMatchDaysModal() {
  const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
  const [createMatchDay] = useCreateMatchDayMutation();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const resetForm = () => {
    setValues(emptyValues);
    setErrors({});
  };

  const closeModal = () => {
    if (isGenerating) return;
    setOpen(false);
    resetForm();
  };

  // Every date in the chosen month that falls on the chosen weekday.
  const matchingDates = useMemo(() => {
    if (!values.month) return [];
    const monthStart = dayjs(`${values.month}-01`);
    if (!monthStart.isValid()) return [];
    const weekday = Number(values.weekday);
    const dates: dayjs.Dayjs[] = [];
    const daysInMonth = monthStart.daysInMonth();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = monthStart.date(d);
      if (date.day() === weekday) dates.push(date);
    }
    return dates;
  }, [values.month, values.weekday]);

  const validate = () => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.month) next.month = "Please select a month!";
    if (!values.time) next.time = "Please select a time!";
    if (!values.venueId) next.venueId = "Please select a venue!";
    if (!values.namePrefix.trim()) next.namePrefix = "Please enter a name prefix!";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!validate()) return;
    if (matchingDates.length === 0) {
      toast.error("No matching dates in that month");
      return;
    }

    setIsGenerating(true);
    let successCount = 0;
    // Sequential, not Promise.all - createMatchDay hits the same table each
    // time; racing several at once risks the kind of unique-constraint 500s
    // this app has hit before elsewhere (see the duplicate-check fixes in
    // PlayerService/AcChart) rather than a clean per-item error.
    for (const date of matchingDates) {
      const matchDayDateNaive = `${date.format("YYYY-MM-DD")}T${values.time}:00`;
      try {
        await createMatchDay({
          matchDayName: `${values.namePrefix} - ${date.format("MMM D")}`,
          matchDayDate: matchDayDateNaive,
          durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
          venueId: Number(values.venueId),
          defaultMatchDay: false,
        }).unwrap();
        successCount++;
      } catch (err) {
        console.error(`Failed to create Match Day for ${date.format("YYYY-MM-DD")}`, err);
      }
    }

    setIsGenerating(false);
    if (successCount > 0) {
      toast.success(`Created ${successCount} of ${matchingDates.length} Match Days`);
    }
    if (successCount === matchingDates.length) {
      setOpen(false);
      resetForm();
    }
  };

  return (
    <div>
      <Button variant="outline" startIcon={<ThunderboltOutlined />} onClick={() => setOpen(true)}>
        Generate
      </Button>
      <Modal isOpen={open} onClose={closeModal} title="Generate Match Days for a Month" className="max-w-[560px]">
        {isVenuesLoading ? null : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                type="month"
                label="Month"
                value={values.month}
                onChange={(e) => setField("month", e.target.value)}
                error={errors.month}
              />
              <FormSelect
                label="Day of Week"
                value={values.weekday}
                onChange={(e) => setField("weekday", e.target.value)}
                options={WEEKDAY_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                type="time"
                label="Time"
                value={values.time}
                onChange={(e) => setField("time", e.target.value)}
                error={errors.time}
              />
              <FormInput
                type="number"
                min={10}
                max={720}
                label="Duration (minutes)"
                value={values.durationMinutes}
                onChange={(e) => setField("durationMinutes", e.target.value)}
              />
            </div>

            <FormSelect
              label="Venue"
              placeholder="Please select a venue"
              value={values.venueId}
              disabled={isVenuesLoading}
              onChange={(e) => setField("venueId", e.target.value)}
              error={errors.venueId}
              options={venuesData?.content.map((venue: any) => ({ value: venue.id, label: venue.name })) || []}
            />

            <FormInput
              label="Name Prefix"
              placeholder="e.g. Match Day"
              hint={`Each entry is named "${values.namePrefix || "prefix"} - date", e.g. "Match Day - Sep 2".`}
              value={values.namePrefix}
              onChange={(e) => setField("namePrefix", e.target.value)}
              error={errors.namePrefix}
            />

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-theme-xs text-gray-600 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)] dark:text-gray-300">
              {matchingDates.length === 0 ? (
                "No matching dates for that month/weekday."
              ) : (
                <>
                  <span className="font-semibold">{matchingDates.length} Match Day{matchingDates.length > 1 ? "s" : ""} will be created:</span>{" "}
                  {matchingDates.map((d) => d.format("MMM D")).join(", ")}
                </>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isGenerating || matchingDates.length === 0}>
              {isGenerating ? `Generating... ` : `Generate ${matchingDates.length || ""} Match Day${matchingDates.length === 1 ? "" : "s"}`}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
