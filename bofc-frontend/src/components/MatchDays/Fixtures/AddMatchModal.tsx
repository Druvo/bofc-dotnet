import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import moment from "moment";
import { useCreateMatchMutation, useGetFixturesQuery } from "../../../state/features/fixtures/fixturesSlice";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import { useGetSystemSettingsQuery } from "../../../state/features/settings/settingsSlice";
import { ICreateMatchRequest } from "../../../state/features/fixtures/fixtureTypes";
import { JERSEY_COLOR_PALETTE } from "../../../utils/jerseyColors";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import Loader from "../../ui/loader";

interface AddMatchModalProps {
  matchDayId: number;
  roundId?: number;
  groupId?: number;
  groupName?: string;
  teams: Array<{ teamId: number; teamName: string }>;
  isModalVisible: boolean;
  handleSetIsModalVisible: (value: boolean) => void;
  onSuccess?: () => void;
}

interface FormValues {
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  matchTime: string;
  venueId: string;
  matchDurationMinutes: string;
  homeJerseyColor: string;
  awayJerseyColor: string;
}

const emptyValues: FormValues = {
  homeTeamId: "",
  awayTeamId: "",
  matchDate: "",
  matchTime: "",
  venueId: "",
  matchDurationMinutes: "90",
  homeJerseyColor: "",
  awayJerseyColor: "",
};

export default function AddMatchModal({
  matchDayId,
  roundId,
  groupId,
  groupName,
  teams,
  isModalVisible,
  handleSetIsModalVisible,
  onSuccess,
}: AddMatchModalProps) {
  const [createMatch, { isLoading }] = useCreateMatchMutation();
  const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
  const venues = venuesData?.content || [];
  const { data: settingsData } = useGetSystemSettingsQuery();
  const jerseyColorOptions = [
    { value: "", label: "Not set" },
    ...(settingsData?.content.jerseyColors || [])
      .map((c) => ({ value: c, label: JERSEY_COLOR_PALETTE.find((p) => p.value === c)?.label || c })),
  ];

  // A round-robin match day creates many fixtures per team - re-picking jersey colors
  // from scratch on every single one is exactly the friction the auto-default below
  // avoids. Only look within this match day, not the team's whole history, since a
  // team's jersey can legitimately change between match days (kit switches season to
  // season) - this match day's own fixtures are what actually needs to stay consistent.
  const { data: fixturesData } = useGetFixturesQuery({ matchDayId });
  const fixtures = fixturesData?.content || [];

  const getTeamUsualColor = (teamId: number): string | undefined => {
    const teamFixtures = [...fixtures]
      .filter((f) => f.homeTeamId === teamId || f.awayTeamId === teamId)
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
    for (const f of teamFixtures) {
      const color = f.homeTeamId === teamId ? f.homeJerseyColor : f.awayJerseyColor;
      if (color) return color;
    }
    return undefined;
  };

  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (isModalVisible) {
      setValues(emptyValues);
      setErrors({});
    }
  }, [isModalVisible, roundId, groupId]);

  // Auto-fill each team's usual jersey color once both teams are picked - minimizes how
  // often an admin has to touch these fields at all. Only overwrites a field the admin
  // hasn't already set by hand, and only auto-assigns a color that doesn't clash with the
  // other team's - a genuine clash is left for the admin to resolve manually (the "if
  // needed then they will switch" case), never silently forced onto the same color.
  useEffect(() => {
    if (!values.homeTeamId || !values.awayTeamId || values.homeTeamId === values.awayTeamId) return;

    const homeUsual = getTeamUsualColor(Number(values.homeTeamId));
    const awayUsual = getTeamUsualColor(Number(values.awayTeamId));

    setValues((prev) => {
      const next = { ...prev };
      if (!prev.homeJerseyColor && homeUsual) next.homeJerseyColor = homeUsual;

      if (!prev.awayJerseyColor) {
        const homeColor = next.homeJerseyColor;
        if (awayUsual && awayUsual !== homeColor) {
          next.awayJerseyColor = awayUsual;
        } else if (!awayUsual) {
          // No history for the away team this match day - pick any palette color that
          // doesn't clash with home's, rather than leaving it on "Not set" by default.
          const available = (settingsData?.content.jerseyColors || []).find((c) => c !== homeColor);
          if (available) next.awayJerseyColor = available;
        }
        // else: awayUsual clashes with homeColor - leave blank, admin picks by hand.
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.homeTeamId, values.awayTeamId, fixtures.length]);

  const validate = () => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.homeTeamId) next.homeTeamId = "Please select home team";
    if (!values.awayTeamId) next.awayTeamId = "Please select away team";
    else if (values.awayTeamId === values.homeTeamId) next.awayTeamId = "Away team must be different from home team";
    if (!values.matchDate) next.matchDate = "Please select match date";
    if (!values.matchTime) next.matchTime = "Please select match time";
    if (values.matchDate && values.matchTime && moment(`${values.matchDate}T${values.matchTime}:00`).isBefore(moment())) {
      next.matchTime = "Match date/time can't be in the past";
    }
    if (!values.venueId) next.venueId = "Please select a venue";
    const duration = Number(values.matchDurationMinutes);
    if (!values.matchDurationMinutes || duration < 10 || duration > 180) next.matchDurationMinutes = "Duration must be between 10 and 180 minutes";
    if (values.homeJerseyColor && values.awayJerseyColor && values.homeJerseyColor === values.awayJerseyColor) {
      next.awayJerseyColor = "Away jersey must differ from home jersey";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleOk = async () => {
    if (!validate()) return;

    const localDateTime = moment(`${values.matchDate}T${values.matchTime}:00`);
    const matchDate = localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");

    const request: ICreateMatchRequest = {
      matchDayId,
      homeTeamId: Number(values.homeTeamId),
      awayTeamId: Number(values.awayTeamId),
      matchDate,
      venueId: Number(values.venueId),
      matchDurationMinutes: Number(values.matchDurationMinutes),
      roundId: roundId,
      groupId: groupId,
      groupName: groupName,
      homeJerseyColor: values.homeJerseyColor || undefined,
      awayJerseyColor: values.awayJerseyColor || undefined,
    };

    try {
      await createMatch(request).unwrap();
      toast.success("Match created successfully");
      handleSetIsModalVisible(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to create match:", error);
      toast.error(error?.data?.message || "Failed to create match");
    }
  };

  const handleCancel = () => {
    handleSetIsModalVisible(false);
  };

  return (
    <Modal
      isOpen={isModalVisible}
      onClose={handleCancel}
      title="Add New Match"
      className="max-w-[550px]"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleOk}>Create Match</Button>
        </>
      }
    >
      {isVenuesLoading ? (
        <Loader className="py-6" />
      ) : (
        <div className="flex flex-col gap-4">
          <FormSelect label="Home Team" placeholder="Select home team" value={values.homeTeamId} onChange={(e) => setField("homeTeamId", e.target.value)} error={errors.homeTeamId} options={teams.map((t) => ({ value: t.teamId, label: t.teamName }))} />
          <FormSelect label="Away Team" placeholder="Select away team" value={values.awayTeamId} onChange={(e) => setField("awayTeamId", e.target.value)} error={errors.awayTeamId} options={teams.map((t) => ({ value: t.teamId, label: t.teamName }))} />

          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Home Jersey" value={values.homeJerseyColor} onChange={(e) => setField("homeJerseyColor", e.target.value)} options={jerseyColorOptions} />
            <FormSelect label="Away Jersey" value={values.awayJerseyColor} onChange={(e) => setField("awayJerseyColor", e.target.value)} options={jerseyColorOptions} error={errors.awayJerseyColor} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput type="date" label="Match Date" value={values.matchDate} onChange={(e) => setField("matchDate", e.target.value)} error={errors.matchDate} />
            <FormInput type="time" label="Match Time" value={values.matchTime} onChange={(e) => setField("matchTime", e.target.value)} error={errors.matchTime} />
          </div>

          <FormSelect
            label="Venue"
            placeholder="Select a venue"
            value={values.venueId}
            onChange={(e) => setField("venueId", e.target.value)}
            error={errors.venueId}
            options={venues.map((v: any) => ({ value: v.id, label: v.name }))}
          />

          <FormInput
            type="number"
            label="Match Duration (minutes)"
            min={10}
            max={180}
            placeholder="Enter duration (e.g., 90)"
            value={values.matchDurationMinutes}
            onChange={(e) => setField("matchDurationMinutes", e.target.value)}
            error={errors.matchDurationMinutes}
          />
        </div>
      )}
    </Modal>
  );
}

export type { AddMatchModalProps };
