import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SettingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import {
  useGetAuctionSettingsQuery,
  useCreateAuctionSettingsMutation,
  useUpdateAuctionSettingsMutation,
  useGetAuctionSessionQuery,
} from "../../state/features/auction/auctionSlice";
import { AuctionSettingsRequest } from "../../state/features/auction/auctionTypes";
import { AuctionPage, AuctionHeader, FormCard, StatusPill } from "./AuctionAtoms";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import FormSwitch from "../ui/form-switch";
import Loader from "../ui/loader";
import Alert from "../ui/alert";

interface FormState {
  scheduledStartTime: string; // datetime-local input value
  teamBudget: number;
  bidIncrement: number;
  auctionTimerSeconds: number;
  maxSquadSize: number;
  minSquadSize: number;
  timerExtensionSeconds: number;
  extendIfBidWithinLastSeconds: number;
  unsoldReauctionEnabled: boolean;
  minRoleRequirements: string;
}

const defaultForm: FormState = {
  scheduledStartTime: "",
  teamBudget: 100000,
  bidIncrement: 1000,
  auctionTimerSeconds: 60,
  maxSquadSize: 11,
  minSquadSize: 7,
  timerExtensionSeconds: 15,
  extendIfBidWithinLastSeconds: 10,
  unsoldReauctionEnabled: true,
  minRoleRequirements: "",
};

const AuctionSettingsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const [form, setForm] = useState<FormState>(defaultForm);

  const { data: settings, isLoading } = useGetAuctionSettingsQuery(tid);
  const { data: session } = useGetAuctionSessionQuery(tid);
  const isLive = session?.status === "RUNNING" || session?.status === "PAUSED";
  const [createSettings, { isLoading: creating }] = useCreateAuctionSettingsMutation();
  const [updateSettings, { isLoading: updating }] = useUpdateAuctionSettingsMutation();

  useEffect(() => {
    if (settings) {
      setForm({
        ...defaultForm,
        ...settings,
        // datetime-local input needs "YYYY-MM-DDTHH:mm", not the ISO string from the API.
        scheduledStartTime: settings.scheduledStartTime ? dayjs(settings.scheduledStartTime).format("YYYY-MM-DDTHH:mm") : "",
        minRoleRequirements: settings.minRoleRequirements ? JSON.stringify(settings.minRoleRequirements) : "",
      });
    }
  }, [settings]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onFinish = async () => {
    const body: AuctionSettingsRequest = {
      ...form,
      // Convert the local datetime value back to an ISO string (or null to clear it).
      scheduledStartTime: form.scheduledStartTime ? dayjs(form.scheduledStartTime).toISOString() : null,
    } as any;
    try {
      if (settings) {
        await updateSettings({ tournamentId: tid, body }).unwrap();
        toast.success("Settings updated");
      } else {
        await createSettings({ tournamentId: tid, body }).unwrap();
        toast.success("Settings created");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save settings");
    }
  };

  if (isLoading) return <Loader className="py-24" />;

  return (
    <AuctionPage>
      <AuctionHeader
        icon={<SettingOutlined />}
        title="Auction Settings"
        subtitle="Budget, timer, bid increment and squad rules for this MatchDay."
        backTo="/auction"
        actions={session?.status ? <StatusPill status={session.status} /> : undefined}
      />
      <FormCard>
        {isLive && (
          <Alert variant="warning" title="Auction is currently live" className="mb-4">
            Changes to timer, bid increment, and squad size will take effect from the next player. Budget changes affect all future bids.
          </Alert>
        )}
        <div className="flex flex-col gap-4">
          <FormInput
            type="datetime-local"
            label="Scheduled Start Time"
            hint="Optional. Shown publicly in the Match Center as a countdown before the auction goes live."
            value={form.scheduledStartTime}
            onChange={(e) => setField("scheduledStartTime", e.target.value)}
          />
          <FormInput
            type="number"
            label="Team Budget"
            min={1}
            value={form.teamBudget}
            onChange={(e) => setField("teamBudget", Number(e.target.value) || 0)}
          />
          <FormInput
            type="number"
            label="Minimum Bid Increment"
            min={1}
            value={form.bidIncrement}
            onChange={(e) => setField("bidIncrement", Number(e.target.value) || 0)}
          />
          <FormInput
            type="number"
            label="Auction Timer (seconds)"
            min={30}
            max={300}
            value={form.auctionTimerSeconds}
            onChange={(e) => setField("auctionTimerSeconds", Number(e.target.value) || 0)}
          />
          <FormInput
            type="number"
            label="Max Squad Size"
            min={1}
            value={form.maxSquadSize}
            onChange={(e) => setField("maxSquadSize", Number(e.target.value) || 0)}
          />
          <FormInput
            type="number"
            label="Min Squad Size"
            min={1}
            value={form.minSquadSize}
            onChange={(e) => setField("minSquadSize", Number(e.target.value) || 0)}
          />
          <FormInput
            type="number"
            label="Timer Extension on Bid (seconds)"
            min={5}
            value={form.timerExtensionSeconds}
            onChange={(e) => setField("timerExtensionSeconds", Number(e.target.value) || 0)}
          />
          <FormInput
            type="number"
            label="Extend if bid in last (seconds)"
            min={5}
            value={form.extendIfBidWithinLastSeconds}
            onChange={(e) => setField("extendIfBidWithinLastSeconds", Number(e.target.value) || 0)}
          />
          <FormSwitch
            label="Allow Unsold Re-auction"
            checked={form.unsoldReauctionEnabled}
            onChange={(checked) => setField("unsoldReauctionEnabled", checked)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Min Role Requirements (JSON)</label>
            <textarea
              rows={2}
              placeholder='e.g. {"GK": 1, "DEF": 2}'
              value={form.minRoleRequirements}
              onChange={(e) => setField("minRoleRequirements", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
          <Button onClick={onFinish} disabled={creating || updating} className="w-full">
            {settings ? "Update Settings" : "Create Settings"}
          </Button>
        </div>
      </FormCard>
    </AuctionPage>
  );
};

export default AuctionSettingsPage;
