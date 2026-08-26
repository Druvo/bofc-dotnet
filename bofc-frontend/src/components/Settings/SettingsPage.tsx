import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { SettingOutlined, MailOutlined, CalendarOutlined, BankOutlined, BellOutlined, FireOutlined, SkinOutlined, ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";
import FormSwitch from "../ui/form-switch";
import Button from "../ui/button";
import Loader from "../ui/loader";
import { Dropdown, DropdownItem } from "../ui/dropdown";
import { JERSEY_COLOR_PALETTE, getJerseySwatch } from "../../utils/jerseyColors";
import { showBdLocalTimeRange } from "../../utils/utils";
import {
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
    useSendTestEmailMutation,
    useGenerateWeeklyMatchesNowMutation,
    useGenerateTeamsNowMutation,
    WeeklyMatchDaySlot,
} from "../../state/features/settings/settingsSlice";
import { useGetVanuesQuery } from "../../state/features/vanues/vanuesSlice";
import { useGetMatchDaysQuery } from "../../state/features/matchDays/matchDaysSlice";
import { useGetAcChartListQuery } from "../../state/features/account/accountSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { isAdmin } from "../../utils/roleUtils";

function JerseyColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    const swatch = getJerseySwatch(value);
    return (
        <div>
            <div className="mb-1.5 text-theme-sm font-medium text-gray-700 dark:text-gray-400">{label}</div>
            <Dropdown
                align="left"
                trigger={({ toggle }) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            toggle();
                        }}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-theme-sm text-gray-800 dark:border-[var(--color-rule)] dark:text-white/90"
                    >
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: swatch || "transparent" }} />
                        {JERSEY_COLOR_PALETTE.find((c) => c.value === value)?.label || "Select"}
                    </button>
                )}
            >
                {(close) => (
                    <>
                        {JERSEY_COLOR_PALETTE.map((color) => (
                            <DropdownItem
                                key={color.value}
                                onClick={() => {
                                    close();
                                    onChange(color.value);
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: color.swatch }} />
                                    {color.label}
                                </span>
                            </DropdownItem>
                        ))}
                    </>
                )}
            </Dropdown>
        </div>
    );
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** My Account (Change Password / Update Player Data) is visible to every logged-in
 * user. Everything else on this page (SMTP, notifications, push, auction, accounting,
 * Next Match, Jersey Colors) is admin/superadmin-only - the backend's
 * SettingsController is already role-gated on every action, so `skip` below just
 * avoids firing a request every non-admin would get a 403 back from. */
function SettingsPage() {
    const navigate = useNavigate();
    const loginInfo = useSelector(selectLoginInfo);
    const admin = isAdmin(loginInfo.roles);

    const { data, isLoading } = useGetSystemSettingsQuery(undefined, { skip: !admin });
    const [updateSettings, { isLoading: isSaving }] = useUpdateSystemSettingsMutation();
    const [sendTestEmail, { isLoading: isSendingTest }] = useSendTestEmailMutation();
    const [generateWeeklyMatchesNow, { isLoading: isGenerating }] = useGenerateWeeklyMatchesNowMutation();
    const [generateTeamsNow, { isLoading: isTestingTeams }] = useGenerateTeamsNowMutation();
    const [testMatchDayId, setTestMatchDayId] = useState<number | undefined>(undefined);

    const [smtpEnabled, setSmtpEnabled] = useState(false);
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpUsername, setSmtpUsername] = useState("");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);
    const [smtpFromEmail, setSmtpFromEmail] = useState("");
    const [smtpFromName, setSmtpFromName] = useState("");
    const [smtpUseSsl, setSmtpUseSsl] = useState(true);

    const [notifyMatchDayReminderEnabled, setNotifyMatchDayReminderEnabled] = useState(false);
    const [matchDayReminderDaysBefore, setMatchDayReminderDaysBefore] = useState(4);
    const [matchDayReminderRepeatHours, setMatchDayReminderRepeatHours] = useState(48);
    const [notifyPaymentDueEnabled, setNotifyPaymentDueEnabled] = useState(false);
    const [paymentDueReminderDayOfMonth, setPaymentDueReminderDayOfMonth] = useState(5);
    const [paymentDueReminderRepeatDays, setPaymentDueReminderRepeatDays] = useState(10);
    const [notifyCustomEmailEnabled, setNotifyCustomEmailEnabled] = useState(false);
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
    const [auctionEnabled, setAuctionEnabled] = useState(true);
    const [matchDayStatusCheckIntervalHours, setMatchDayStatusCheckIntervalHours] = useState(1);

    const [weeklyMatchDayEnabled, setWeeklyMatchDayEnabled] = useState(false);
    const [weeklyMatchDayNamePrefix, setWeeklyMatchDayNamePrefix] = useState("Next Match");
    const [weeklyMatchDayVenueId, setWeeklyMatchDayVenueId] = useState<number | undefined>(undefined);
    const [weeklyMatchDaySportType, setWeeklyMatchDaySportType] = useState("FOOTBALL");

    const [matchDaysPerWeek, setMatchDaysPerWeek] = useState(1);
    const [weeklyMatchDaySlots, setWeeklyMatchDaySlots] = useState<WeeklyMatchDaySlot[]>([
        { dayOfWeek: "Friday", time: "19:00", durationMinutes: 90, matchDurationMinutes: 13, timeGapMinutes: 15 },
    ]);
    const [weeklyMatchDayMaxPlayersPerTeam, setWeeklyMatchDayMaxPlayersPerTeam] = useState(6);
    const [weeklyMatchDayAutoTeamsEnabled, setWeeklyMatchDayAutoTeamsEnabled] = useState(false);
    const [weeklyMatchDayAutoTeamsLeadHours, setWeeklyMatchDayAutoTeamsLeadHours] = useState(24);

    const handleMatchDaysPerWeekChange = (count: number) => {
        const clamped = Math.min(7, Math.max(1, count || 1));
        setMatchDaysPerWeek(clamped);
        setWeeklyMatchDaySlots((prev) => {
            if (clamped === prev.length) return prev;
            if (clamped < prev.length) return prev.slice(0, clamped);
            const extra = Array.from({ length: clamped - prev.length }, () => ({
                dayOfWeek: "Friday",
                time: "19:00",
                durationMinutes: 90,
                matchDurationMinutes: 13,
                timeGapMinutes: 15,
            }));
            return [...prev, ...extra];
        });
    };

    const updateSlot = (index: number, patch: Partial<WeeklyMatchDaySlot>) => {
        setWeeklyMatchDaySlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
    };

    const handleGenerateNow = async () => {
        // Slots/settings only exist in the DB after Save - generating against unsaved
        // in-browser state would silently use whatever was last persisted.
        const saved = await handleSave();
        if (!saved) return;

        try {
            const result = await generateWeeklyMatchesNow().unwrap();
            const { matchDaysCreated, teamsGenerated } = result.content;
            toast.success(`Generated ${matchDaysCreated} Match Day(s), ${teamsGenerated} team set(s)`);
        } catch (err: any) {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to generate matches"));
        }
    };

    const [cashChartCode, setCashChartCode] = useState<string | undefined>(undefined);
    const [collectionIncomeChartCode, setCollectionIncomeChartCode] = useState<string | undefined>(undefined);

    const [jerseyColors, setJerseyColors] = useState<string[]>(["red", "yellow"]);

    const updateJerseyColor = (index: number, color: string) => {
        setJerseyColors((prev) => prev.map((c, i) => (i === index ? color : c)));
    };

    const addJerseyColor = () => {
        setJerseyColors((prev) => {
            const unused = JERSEY_COLOR_PALETTE.map((c) => c.value).find((v) => !prev.includes(v));
            return [...prev, unused || JERSEY_COLOR_PALETTE[0].value];
        });
    };

    const removeJerseyColor = (index: number) => {
        setJerseyColors((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
    };

    const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
    const { data: chartsData, isLoading: isChartsLoading } = useGetAcChartListQuery();
    const { data: matchDaysData, isLoading: isMatchDaysLoading } = useGetMatchDaysQuery(
        { offSet: 0, pageSize: 50, sortedBy: "matchDayDate", sortDirection: "ASC" },
        { skip: !weeklyMatchDayAutoTeamsEnabled }
    );
    const weeklyMatchDayOptionsList = (matchDaysData?.content?.matchDays ?? [])
        .filter((m) => m.isWeeklyMatchDay)
        .map((m) => ({ value: m.id, label: `${m.name} - ${showBdLocalTimeRange(m.matchDayDate, m.durationMinutes)}` }));

    const handleTestGenerateTeams = async () => {
        if (!testMatchDayId) {
            toast.error("Pick a Match Day to test against");
            return;
        }
        try {
            const result = await generateTeamsNow({ matchDayId: testMatchDayId }).unwrap();
            if (result.content.success) {
                toast.success("Teams generated for the selected Match Day");
            } else {
                toast.error(result.content.reason || "Could not generate teams");
            }
        } catch (err: any) {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to test team generation"));
        }
    };

    const [testEmailAddress, setTestEmailAddress] = useState("");

    useEffect(() => {
        if (!data?.content) return;
        const s = data.content;
        setSmtpEnabled(s.smtpEnabled);
        setSmtpHost(s.smtpHost || "");
        setSmtpPort(s.smtpPort);
        setSmtpUsername(s.smtpUsername || "");
        setSmtpPasswordSet(s.smtpPasswordSet);
        setSmtpFromEmail(s.smtpFromEmail || "");
        setSmtpFromName(s.smtpFromName || "");
        setSmtpUseSsl(s.smtpUseSsl);
        setNotifyMatchDayReminderEnabled(s.notifyMatchDayReminderEnabled);
        setMatchDayReminderDaysBefore(s.matchDayReminderDaysBefore);
        setMatchDayReminderRepeatHours(s.matchDayReminderRepeatHours || 48);
        setNotifyPaymentDueEnabled(s.notifyPaymentDueEnabled);
        setPaymentDueReminderDayOfMonth(s.paymentDueReminderDayOfMonth);
        setPaymentDueReminderRepeatDays(s.paymentDueReminderRepeatDays || 10);
        setNotifyCustomEmailEnabled(s.notifyCustomEmailEnabled);
        setPushNotificationsEnabled(s.pushNotificationsEnabled);
        setAuctionEnabled(s.auctionEnabled);
        setMatchDayStatusCheckIntervalHours(s.matchDayStatusCheckIntervalHours || 1);
        setWeeklyMatchDayEnabled(s.weeklyMatchDayEnabled);
        setWeeklyMatchDayNamePrefix(s.weeklyMatchDayNamePrefix);
        setWeeklyMatchDayVenueId(s.weeklyMatchDayVenueId ?? undefined);
        setWeeklyMatchDaySportType(s.weeklyMatchDaySportType);
        setMatchDaysPerWeek(s.matchDaysPerWeek || 1);
        setWeeklyMatchDaySlots(
            s.weeklyMatchDaySlots?.length
                ? s.weeklyMatchDaySlots
                : [{ dayOfWeek: s.weeklyMatchDayOfWeek, time: s.weeklyMatchTime, durationMinutes: 90, matchDurationMinutes: 13, timeGapMinutes: 15 }]
        );
        setWeeklyMatchDayMaxPlayersPerTeam(s.weeklyMatchDayMaxPlayersPerTeam || 6);
        setWeeklyMatchDayAutoTeamsEnabled(s.weeklyMatchDayAutoTeamsEnabled);
        setWeeklyMatchDayAutoTeamsLeadHours(s.weeklyMatchDayAutoTeamsLeadHours || 24);
        setCashChartCode(s.cashChartCodeIsOverridden ? s.cashChartCode : undefined);
        setCollectionIncomeChartCode(s.collectionIncomeChartCodeIsOverridden ? s.collectionIncomeChartCode : undefined);
        setJerseyColors(s.jerseyColors?.length ? s.jerseyColors : ["red", "yellow"]);
    }, [data]);

    const handleSave = async (): Promise<boolean> => {
        if (weeklyMatchDayEnabled && !weeklyMatchDayVenueId) {
            toast.error("Pick a venue for the weekly Match Day before enabling it");
            return false;
        }
        if (weeklyMatchDayEnabled && weeklyMatchDaySlots.length === 0) {
            toast.error("Add at least one Match Day day/time before enabling it");
            return false;
        }
        if (jerseyColors.length < 2) {
            toast.error("At least 2 jersey colors are required - the club needs 2 distinct colors to tell the teams in a match apart");
            return false;
        }
        if (new Set(jerseyColors).size !== jerseyColors.length) {
            toast.error("Jersey colors must be unique - no duplicates");
            return false;
        }
        try {
            await updateSettings({
                smtpEnabled,
                smtpHost: smtpHost.trim(),
                smtpPort,
                smtpUsername: smtpUsername.trim(),
                // Leave the field blank to keep the currently stored password untouched.
                smtpPassword: smtpPassword.length > 0 ? smtpPassword : undefined,
                smtpFromEmail: smtpFromEmail.trim(),
                smtpFromName: smtpFromName.trim(),
                smtpUseSsl,
                notifyMatchDayReminderEnabled,
                matchDayReminderDaysBefore,
                matchDayReminderRepeatHours,
                notifyPaymentDueEnabled,
                paymentDueReminderDayOfMonth,
                paymentDueReminderRepeatDays,
                notifyCustomEmailEnabled,
                pushNotificationsEnabled,
                auctionEnabled,
                matchDayStatusCheckIntervalHours,
                weeklyMatchDayEnabled,
                weeklyMatchDayNamePrefix,
                weeklyMatchDayOfWeek: weeklyMatchDaySlots[0]?.dayOfWeek || "Friday",
                weeklyMatchTime: weeklyMatchDaySlots[0]?.time || "19:00",
                weeklyMatchDayVenueId,
                weeklyMatchDaySportType,
                matchDaysPerWeek,
                weeklyMatchDaySlots,
                weeklyMatchDayMaxPlayersPerTeam,
                weeklyMatchDayAutoTeamsEnabled,
                weeklyMatchDayAutoTeamsLeadHours,
                cashChartCode: cashChartCode ?? null,
                collectionIncomeChartCode: collectionIncomeChartCode ?? null,
                jerseyColors,
            }).unwrap();
            toast.success("Settings saved");
            setSmtpPassword("");
            return true;
        } catch (err: any) {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to save settings"));
            return false;
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmailAddress.trim()) {
            toast.error("Enter an email address to send the test to");
            return;
        }
        try {
            await sendTestEmail({ toEmail: testEmailAddress.trim() }).unwrap();
            toast.success(`Test email sent to ${testEmailAddress.trim()}`);
        } catch (err: any) {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to send test email"));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader />
            </div>
        );
    }

    if (!admin) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    Nothing to configure here. To change your password or profile details, go to your{" "}
                    <a href="/profile" className="text-brand-500 hover:underline dark:text-brand-400">Player Profile</a>.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {admin && (
            <>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <MailOutlined className="text-brand-500 dark:text-brand-400" />
                    SMTP / Email Configuration
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Credentials for the mail server the app sends notification emails through.
                </p>

                <div className="mb-5">
                    <FormSwitch label="Enable email sending" checked={smtpEnabled} onChange={setSmtpEnabled} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput label="SMTP Host" placeholder="smtp.gmail.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                    <FormInput
                        label="SMTP Port"
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value) || 0)}
                    />
                    <FormInput label="SMTP Username" placeholder="you@example.com" value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} />
                    <FormInput
                        label="SMTP Password"
                        type="password"
                        placeholder={smtpPasswordSet ? "•••••••• (saved - leave blank to keep)" : "Enter password"}
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                    />
                    <FormInput label="From Email" placeholder="noreply@bofc.local" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} />
                    <FormInput label="From Name" placeholder="BOFC" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} />
                </div>

                <div className="mt-4">
                    <FormSwitch label="Use SSL/TLS" checked={smtpUseSsl} onChange={setSmtpUseSsl} />
                </div>

                <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5 dark:border-[var(--color-rule)]">
                    <div className="min-w-[240px] flex-1">
                        <FormInput
                            label="Send a test email to"
                            placeholder="you@example.com"
                            value={testEmailAddress}
                            onChange={(e) => setTestEmailAddress(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={handleSendTestEmail} disabled={isSendingTest || !smtpEnabled}>
                        {isSendingTest ? "Sending..." : "Send Test Email"}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <FileTextOutlined className="text-brand-500 dark:text-brand-400" />
                    Email Templates
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Edit the subject and body of the payment-due reminder and upcoming Match Day reminder emails - each supports a few placeholders that get filled in automatically when it's sent.
                </p>
                <Button variant="outline" onClick={() => navigate("/settings/email-templates")}>
                    Manage Templates
                </Button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <SettingOutlined className="text-brand-500 dark:text-brand-400" />
                    Automated Email Notifications
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Turn individual automated notifications on or off. Each still requires SMTP to be enabled above to actually send email - in-app notifications go out regardless.
                </p>

                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4 dark:border-[var(--color-rule)]">
                        <div>
                            <FormSwitch label="Upcoming Match Day reminder" checked={notifyMatchDayReminderEnabled} onChange={setNotifyMatchDayReminderEnabled} />
                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                                Reminds every player who hasn't voted Yes/No yet, starting this many days before kickoff - repeats until they vote or the Match Day starts.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-36">
                                <FormInput
                                    label="Days before"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={matchDayReminderDaysBefore}
                                    onChange={(e) => setMatchDayReminderDaysBefore(Number(e.target.value) || 1)}
                                    disabled={!notifyMatchDayReminderEnabled}
                                />
                            </div>
                            <div className="w-36">
                                <FormInput
                                    label="Repeat every (hrs)"
                                    type="number"
                                    min={1}
                                    max={168}
                                    value={matchDayReminderRepeatHours}
                                    onChange={(e) => setMatchDayReminderRepeatHours(Number(e.target.value) || 1)}
                                    disabled={!notifyMatchDayReminderEnabled}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4 dark:border-[var(--color-rule)]">
                        <div>
                            <FormSwitch label="Monthly payment due reminder" checked={notifyPaymentDueEnabled} onChange={setNotifyPaymentDueEnabled} />
                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                                Reminds players who haven't paid dues for the current month, starting on this day - repeats until they pay or the month rolls over.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-36">
                                <FormInput
                                    label="Day of month"
                                    type="number"
                                    min={1}
                                    max={28}
                                    value={paymentDueReminderDayOfMonth}
                                    onChange={(e) => setPaymentDueReminderDayOfMonth(Number(e.target.value) || 1)}
                                    disabled={!notifyPaymentDueEnabled}
                                />
                            </div>
                            <div className="w-36">
                                <FormInput
                                    label="Repeat every (days)"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={paymentDueReminderRepeatDays}
                                    onChange={(e) => setPaymentDueReminderRepeatDays(Number(e.target.value) || 1)}
                                    disabled={!notifyPaymentDueEnabled}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-4 dark:border-[var(--color-rule)]">
                        <FormSwitch label="Allow email on custom notifications" checked={notifyCustomEmailEnabled} onChange={setNotifyCustomEmailEnabled} />
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            When on, the "Also send email" option becomes available in the Notify button's Send Notification dialog.
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <BellOutlined className="text-brand-500 dark:text-brand-400" />
                    Push Notifications
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Master switch for browser/device push delivery. When off, nothing is pushed to any player's device regardless of their individual subscription - in-app notifications are unaffected.
                </p>

                <FormSwitch label="Enable push notifications" checked={pushNotificationsEnabled} onChange={setPushNotificationsEnabled} />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <FireOutlined className="text-brand-500 dark:text-brand-400" />
                    Auction
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Master switch for the player-auction feature. When off, the Auction nav entry and the "Auction Mode" toggle on Match Day creation are hidden club-wide.
                </p>

                <FormSwitch label="Enable auction" checked={auctionEnabled} onChange={setAuctionEnabled} />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <ClockCircleOutlined className="text-brand-500 dark:text-brand-400" />
                    Scheduler
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    How often the background job re-checks Match Days and concludes any that are overdue. Takes effect after the current wait finishes - no restart needed.
                </p>

                <div className="w-48">
                    <FormInput
                        label="Status check interval (hours)"
                        type="number"
                        min={1}
                        max={24}
                        value={matchDayStatusCheckIntervalHours}
                        onChange={(e) => setMatchDayStatusCheckIntervalHours(Number(e.target.value) || 1)}
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <BankOutlined className="text-brand-500 dark:text-brand-400" />
                    Accounting
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Which chart of account every collection and bill payment posts to. Changing this here takes effect immediately - no restart needed. Leave unset to use the deployment default from appsettings.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <FormSelect
                            label="Cash chart"
                            placeholder="Use deployment default"
                            disabled={isChartsLoading}
                            value={cashChartCode ?? ""}
                            onChange={(e) => setCashChartCode(e.target.value || undefined)}
                            options={(chartsData?.content ?? []).map((c: any) => ({ value: String(c.code), label: `${c.name} (${c.code})` }))}
                        />
                        <p className="mt-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
                            {cashChartCode ? "Overriding the default." : `Currently using: ${data?.content?.cashChartName ?? data?.content?.cashChartCode ?? "-"} (default)`}
                        </p>
                    </div>
                    <div>
                        <FormSelect
                            label="Collection income chart"
                            placeholder="Use deployment default"
                            disabled={isChartsLoading}
                            value={collectionIncomeChartCode ?? ""}
                            onChange={(e) => setCollectionIncomeChartCode(e.target.value || undefined)}
                            options={(chartsData?.content ?? []).map((c: any) => ({ value: String(c.code), label: `${c.name} (${c.code})` }))}
                        />
                        <p className="mt-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
                            {collectionIncomeChartCode ? "Overriding the default." : `Currently using: ${data?.content?.collectionIncomeChartName ?? data?.content?.collectionIncomeChartCode ?? "-"} (default)`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <SkinOutlined className="text-brand-500 dark:text-brand-400" />
                    Jersey Colors
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    The club's physical jerseys - configure as many as the club owns (at least 2).
                    These are the colors available when assigning a jersey to each team per match
                    on the Next Match fixtures panel.
                </p>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {jerseyColors.map((color, index) => (
                            <div key={index} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <JerseyColorPicker
                                        label={`Jersey ${index + 1}`}
                                        value={color}
                                        onChange={(value) => updateJerseyColor(index, value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="!px-2.5"
                                    disabled={jerseyColors.length <= 2}
                                    onClick={() => removeJerseyColor(index)}
                                >
                                    ✕
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div>
                        <Button type="button" variant="outline" size="sm" onClick={addJerseyColor}>
                            + Add Jersey Color
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
                    Weekly Match Day
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    A weekly club-wide Match Day, created and announced automatically as soon as the previous one's date passes. Teams, jersey colors, and matches are managed from that Match Day's page; every active player is notified to RSVP.
                </p>

                <div className="mb-5">
                    <FormSwitch label="Enable Weekly Match Day" checked={weeklyMatchDayEnabled} onChange={setWeeklyMatchDayEnabled} />
                </div>

                {weeklyMatchDayEnabled && (
                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormInput
                            label="Name prefix"
                            placeholder="Next Match"
                            value={weeklyMatchDayNamePrefix}
                            onChange={(e) => setWeeklyMatchDayNamePrefix(e.target.value)}
                        />
                        <FormSelect
                            label="Venue"
                            placeholder="Please select a venue"
                            value={weeklyMatchDayVenueId ?? ""}
                            disabled={isVenuesLoading}
                            onChange={(e) => setWeeklyMatchDayVenueId(Number(e.target.value))}
                            options={venuesData?.content.map((v: any) => ({ value: v.id, label: v.name })) || []}
                        />
                    </div>

                    <div className="rounded-lg border border-gray-100 p-4 dark:border-[var(--color-rule)]">
                        <div className="mb-3 w-40">
                            <FormInput
                                label="Matches per week"
                                type="number"
                                min={1}
                                max={7}
                                value={matchDaysPerWeek}
                                onChange={(e) => handleMatchDaysPerWeekChange(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            {weeklyMatchDaySlots.map((slot, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-3 dark:border-[var(--color-rule)]"
                                >
                                    {/* MatchDay-level: when this Match Day happens and how long the whole day runs. */}
                                    <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                        Match Day {index + 1}
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <FormSelect
                                            label="Day"
                                            value={slot.dayOfWeek}
                                            onChange={(e) => updateSlot(index, { dayOfWeek: e.target.value })}
                                            options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))}
                                        />
                                        <FormInput
                                            label="Time"
                                            type="time"
                                            value={slot.time}
                                            onChange={(e) => updateSlot(index, { time: e.target.value })}
                                        />
                                        <FormInput
                                            label="Total duration (min)"
                                            hint="Whole Match Day's length (e.g. 6:00–7:30pm = 90) - not any single match's length."
                                            type="number"
                                            min={15}
                                            max={300}
                                            value={slot.durationMinutes}
                                            onChange={(e) => updateSlot(index, { durationMinutes: Number(e.target.value) || 90 })}
                                        />
                                    </div>

                                    {/* Match-level: applies to each individual match auto-generated inside this Match Day - separated from the fields above so it doesn't read as another Match Day property. */}
                                    <p className="mb-2 mt-3 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                        Matches within Match Day {index + 1}
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <FormInput
                                            label="Match duration (min)"
                                            hint="Length of each individual auto-generated match - not this Match Day's own total duration above."
                                            type="number"
                                            min={5}
                                            max={180}
                                            value={slot.matchDurationMinutes}
                                            onChange={(e) => updateSlot(index, { matchDurationMinutes: Number(e.target.value) || 13 })}
                                        />
                                        <FormInput
                                            label="Gap between matches (min)"
                                            hint="Breather between one auto-generated match ending and the next starting - a per-match setting, not this Match Day's own total duration above."
                                            type="number"
                                            min={0}
                                            max={120}
                                            value={slot.timeGapMinutes}
                                            onChange={(e) => {
                                                // `|| 15` would treat 0 as falsy and silently snap it back to
                                                // 15 - 0 (no gap) is a valid, intentional choice (matches the
                                                // manual fixture-generation modal, which allows it too).
                                                const parsed = Number(e.target.value);
                                                updateSlot(index, { timeGapMinutes: Number.isNaN(parsed) ? 15 : parsed });
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-4 dark:border-[var(--color-rule)]">
                        <div className="mb-3">
                            <FormInput
                                label="Players per Team (max)"
                                hint="Includes the goalkeeper - e.g. 6 for 5-a-side + 1 GK."
                                type="number"
                                min={2}
                                max={11}
                                value={weeklyMatchDayMaxPlayersPerTeam}
                                onChange={(e) => setWeeklyMatchDayMaxPlayersPerTeam(Number(e.target.value) || 6)}
                            />
                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                                The number of teams is worked out automatically from how many players confirm - e.g. 13 confirmed at a cap of 6 makes 3 teams - rather than a fixed team count. An admin can still add/remove players by hand afterward on any given Match Day.
                            </p>
                        </div>

                        <FormSwitch
                            label="Auto-generate teams and fixtures"
                            checked={weeklyMatchDayAutoTeamsEnabled}
                            onChange={setWeeklyMatchDayAutoTeamsEnabled}
                        />
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            Confirmed players are auto-drafted into balanced teams (using each player's admin-set rank) and their fixtures scheduled automatically, ahead of kickoff.
                        </p>

                        {weeklyMatchDayAutoTeamsEnabled && (
                            <>
                                <div className="mt-3 w-56">
                                    <FormInput
                                        label="Hours before kickoff"
                                        type="number"
                                        min={1}
                                        max={168}
                                        value={weeklyMatchDayAutoTeamsLeadHours}
                                        onChange={(e) => setWeeklyMatchDayAutoTeamsLeadHours(Number(e.target.value) || 24)}
                                    />
                                </div>

                                <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-3 dark:border-[var(--color-rule)]">
                                    <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
                                        Test team + fixture auto-generation on a specific Match Day right now, bypassing the
                                        lead-time wait above - drafts teams, schedules their round-robin matches, and assigns
                                        jerseys in one step.
                                    </p>
                                    <div className="flex flex-wrap items-end gap-2">
                                        <div className="min-w-[220px] flex-1">
                                            <FormSelect
                                                label="Match Day"
                                                placeholder={isMatchDaysLoading ? "Loading..." : "Select a Match Day"}
                                                disabled={isMatchDaysLoading}
                                                value={testMatchDayId ?? ""}
                                                onChange={(e) => setTestMatchDayId(e.target.value ? Number(e.target.value) : undefined)}
                                                options={weeklyMatchDayOptionsList}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!testMatchDayId || isTestingTeams}
                                            onClick={handleTestGenerateTeams}
                                        >
                                            {isTestingTeams ? "Testing..." : "Test Generate Teams & Fixtures"}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-4 dark:border-[var(--color-rule)]">
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                            Saves the settings above, then runs the generator right now instead of waiting for the hourly check - useful to verify the configuration works as expected.
                        </p>
                        <Button variant="outline" onClick={handleGenerateNow} disabled={isGenerating || isSaving}>
                            {isGenerating || isSaving ? "Working..." : "Save & Generate for this month"}
                        </Button>
                    </div>
                </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                </Button>
            </div>
            </>
            )}
        </div>
    );
}

export default SettingsPage;
