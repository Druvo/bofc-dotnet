import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { SettingOutlined, MailOutlined, CalendarOutlined, BankOutlined, BellOutlined, FireOutlined, SkinOutlined, UserOutlined, LockOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";
import FormSwitch from "../ui/form-switch";
import Button from "../ui/button";
import Loader from "../ui/loader";
import { Dropdown, DropdownItem } from "../ui/dropdown";
import { JERSEY_COLOR_PALETTE, getJerseySwatch } from "../../utils/jerseyColors";
import {
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
    useSendTestEmailMutation,
} from "../../state/features/settings/settingsSlice";
import {
    useChangePasswordMutation,
    useUpdatePlayerDataMutation,
    useGetUserProfileQuery,
} from "../../state/features/auth/authSlice";
import { useGetPlayerPositionsQuery } from "../../state/features/player/playerSlice";
import { useGetVanuesQuery } from "../../state/features/vanues/vanuesSlice";
import { useGetAcChartListQuery } from "../../state/features/account/accountSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { isAdmin } from "../../utils/roleUtils";

/** Change Password + Update Player Data — every logged-in user's own account,
 * ported from the old header-dropdown modal (CommonAtoms/SettingsModal.tsx) so it
 * lives on the same page as the rest of Settings instead of a separate modal. */
function MyAccountSection() {
    const loginInfo = useSelector(selectLoginInfo);
    const { data: profileData, isLoading: isProfileLoading } = useGetUserProfileQuery(
        { id: loginInfo?.userId || "" },
        { skip: !loginInfo?.userId }
    );
    const [changePassword, { isLoading: isChangePasswordLoading }] = useChangePasswordMutation();
    const [updatePlayerData, { isLoading: isUpdatePlayerLoading }] = useUpdatePlayerDataMutation();
    const { data: playerPositions } = useGetPlayerPositionsQuery();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [playerInfo, setPlayerInfo] = useState({
        id: 0,
        name: "",
        email: "",
        employeeId: "",
        fullName: "",
        teamsId: "",
        mobileNo: "",
        playingPosition: "",
    });

    useEffect(() => {
        const p = profileData?.content;
        if (!p) return;
        setPlayerInfo({
            id: p.id,
            name: p.name || "",
            email: p.email || "",
            employeeId: p.employeeId || "",
            fullName: p.fullName || "",
            teamsId: p.teamsId || "",
            mobileNo: p.mobileNo || "",
            playingPosition: p.playingPosition || "",
        });
    }, [profileData]);

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            toast.error("Both fields are mandatory!");
            return;
        }
        try {
            await changePassword({ oldPassword, newPassword }).unwrap();
            toast.success("Password updated successfully");
            setOldPassword("");
            setNewPassword("");
        } catch (err: any) {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to update password"));
        }
    };

    const handleUpdatePlayerData = async () => {
        if (!playerInfo.name || !playerInfo.email) {
            toast.error("Name and Email are mandatory!");
            return;
        }
        try {
            await updatePlayerData({ id: playerInfo.id, data: playerInfo }).unwrap();
            toast.success("Player data updated successfully");
        } catch (err: any) {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to update player data"));
        }
    };

    if (isProfileLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader />
            </div>
        );
    }

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <LockOutlined className="text-brand-500 dark:text-brand-400" />
                    Change Password
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">Your own login password.</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput type="password" autoComplete="current-password" label="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    <FormInput type="password" autoComplete="new-password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>

                <div className="mt-4 flex justify-end">
                    <Button disabled={isChangePasswordLoading} onClick={handleChangePassword}>
                        {isChangePasswordLoading ? "Updating..." : "Update Password"}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <UserOutlined className="text-brand-500 dark:text-brand-400" />
                    Update Player Data
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">Your own profile details.</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput autoComplete="name" label="Name" value={playerInfo.name} onChange={(e) => setPlayerInfo({ ...playerInfo, name: e.target.value })} />
                    <FormInput type="email" autoComplete="email" label="Email" value={playerInfo.email} onChange={(e) => setPlayerInfo({ ...playerInfo, email: e.target.value })} />
                    <FormInput autoComplete="off" label="Employee ID" value={playerInfo.employeeId} onChange={(e) => setPlayerInfo({ ...playerInfo, employeeId: e.target.value })} />
                    <FormInput autoComplete="off" label="Teams ID" value={playerInfo.teamsId} onChange={(e) => setPlayerInfo({ ...playerInfo, teamsId: e.target.value })} />
                    <FormInput type="tel" autoComplete="tel" label="Mobile No" value={playerInfo.mobileNo} onChange={(e) => setPlayerInfo({ ...playerInfo, mobileNo: e.target.value })} />
                    <FormSelect
                        label="Playing Position"
                        placeholder="Select Playing Position"
                        value={playerInfo.playingPosition}
                        onChange={(e) => setPlayerInfo({ ...playerInfo, playingPosition: e.target.value })}
                        options={(playerPositions?.content || []).map((position) => ({
                            value: position.name,
                            label: position.description,
                        }))}
                    />
                </div>

                <div className="mt-4 flex justify-end">
                    <Button disabled={isUpdatePlayerLoading} onClick={handleUpdatePlayerData}>
                        {isUpdatePlayerLoading ? "Updating..." : "Update Player Info"}
                    </Button>
                </div>
            </div>
        </>
    );
}

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
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
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
const SPORT_TYPES = ["FOOTBALL", "CRICKET", "BASKETBALL"];

/** My Account (Change Password / Update Player Data) is visible to every logged-in
 * user. Everything else on this page (SMTP, notifications, push, auction, accounting,
 * Next Match, Jersey Colors) is admin/superadmin-only — the backend's
 * SettingsController is already role-gated on every action, so `skip` below just
 * avoids firing a request every non-admin would get a 403 back from. */
function SettingsPage() {
    const loginInfo = useSelector(selectLoginInfo);
    const admin = isAdmin(loginInfo.roles);

    const { data, isLoading } = useGetSystemSettingsQuery(undefined, { skip: !admin });
    const [updateSettings, { isLoading: isSaving }] = useUpdateSystemSettingsMutation();
    const [sendTestEmail, { isLoading: isSendingTest }] = useSendTestEmailMutation();

    const [smtpEnabled, setSmtpEnabled] = useState(false);
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpUsername, setSmtpUsername] = useState("");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);
    const [smtpFromEmail, setSmtpFromEmail] = useState("");
    const [smtpFromName, setSmtpFromName] = useState("");
    const [smtpUseSsl, setSmtpUseSsl] = useState(true);

    const [notifyTournamentReminderEnabled, setNotifyTournamentReminderEnabled] = useState(false);
    const [tournamentReminderDaysBefore, setTournamentReminderDaysBefore] = useState(3);
    const [notifyPaymentDueEnabled, setNotifyPaymentDueEnabled] = useState(false);
    const [paymentDueReminderDayOfMonth, setPaymentDueReminderDayOfMonth] = useState(25);
    const [notifyCustomEmailEnabled, setNotifyCustomEmailEnabled] = useState(false);
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
    const [auctionEnabled, setAuctionEnabled] = useState(true);

    const [weeklyMatchEnabled, setWeeklyMatchEnabled] = useState(false);
    const [weeklyMatchNamePrefix, setWeeklyMatchNamePrefix] = useState("Next Match");
    const [weeklyMatchDayOfWeek, setWeeklyMatchDayOfWeek] = useState("Friday");
    const [weeklyMatchTime, setWeeklyMatchTime] = useState("19:00");
    const [weeklyMatchVenueId, setWeeklyMatchVenueId] = useState<number | undefined>(undefined);
    const [weeklyMatchSportType, setWeeklyMatchSportType] = useState("FOOTBALL");
    const [weeklyMatchDurationMinutes, setWeeklyMatchDurationMinutes] = useState(90);
    const [weeklyMatchTimeGapMinutes, setWeeklyMatchTimeGapMinutes] = useState(15);

    const [cashChartCode, setCashChartCode] = useState<string | undefined>(undefined);
    const [collectionIncomeChartCode, setCollectionIncomeChartCode] = useState<string | undefined>(undefined);

    const [jerseyColorA, setJerseyColorA] = useState("red");
    const [jerseyColorB, setJerseyColorB] = useState("yellow");

    const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
    const { data: chartsData, isLoading: isChartsLoading } = useGetAcChartListQuery();

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
        setNotifyTournamentReminderEnabled(s.notifyTournamentReminderEnabled);
        setTournamentReminderDaysBefore(s.tournamentReminderDaysBefore);
        setNotifyPaymentDueEnabled(s.notifyPaymentDueEnabled);
        setPaymentDueReminderDayOfMonth(s.paymentDueReminderDayOfMonth);
        setNotifyCustomEmailEnabled(s.notifyCustomEmailEnabled);
        setPushNotificationsEnabled(s.pushNotificationsEnabled);
        setAuctionEnabled(s.auctionEnabled);
        setWeeklyMatchEnabled(s.weeklyMatchEnabled);
        setWeeklyMatchNamePrefix(s.weeklyMatchNamePrefix);
        setWeeklyMatchDayOfWeek(s.weeklyMatchDayOfWeek);
        setWeeklyMatchTime(s.weeklyMatchTime);
        setWeeklyMatchVenueId(s.weeklyMatchVenueId ?? undefined);
        setWeeklyMatchSportType(s.weeklyMatchSportType);
        setWeeklyMatchDurationMinutes(s.weeklyMatchDurationMinutes);
        setWeeklyMatchTimeGapMinutes(s.weeklyMatchTimeGapMinutes);
        setCashChartCode(s.cashChartCodeIsOverridden ? s.cashChartCode : undefined);
        setCollectionIncomeChartCode(s.collectionIncomeChartCodeIsOverridden ? s.collectionIncomeChartCode : undefined);
        setJerseyColorA(s.jerseyColorA);
        setJerseyColorB(s.jerseyColorB);
    }, [data]);

    const handleSave = async () => {
        if (weeklyMatchEnabled && !weeklyMatchVenueId) {
            toast.error("Pick a venue for the weekly match before enabling it");
            return;
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
                notifyTournamentReminderEnabled,
                tournamentReminderDaysBefore,
                notifyPaymentDueEnabled,
                paymentDueReminderDayOfMonth,
                notifyCustomEmailEnabled,
                pushNotificationsEnabled,
                auctionEnabled,
                weeklyMatchEnabled,
                weeklyMatchNamePrefix,
                weeklyMatchDayOfWeek,
                weeklyMatchTime,
                weeklyMatchVenueId,
                weeklyMatchSportType,
                weeklyMatchDurationMinutes,
                weeklyMatchTimeGapMinutes,
                cashChartCode: cashChartCode ?? null,
                collectionIncomeChartCode: collectionIncomeChartCode ?? null,
                jerseyColorA,
                jerseyColorB,
            }).unwrap();
            toast.success("Settings saved");
            setSmtpPassword("");
        } catch (err: any) {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to save settings"));
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

    return (
        <div className="flex flex-col gap-6">
            <MyAccountSection />

            {admin && (
            <>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
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
                        placeholder={smtpPasswordSet ? "•••••••• (saved — leave blank to keep)" : "Enter password"}
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                    />
                    <FormInput label="From Email" placeholder="noreply@bofc.local" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} />
                    <FormInput label="From Name" placeholder="BOFC" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} />
                </div>

                <div className="mt-4">
                    <FormSwitch label="Use SSL/TLS" checked={smtpUseSsl} onChange={setSmtpUseSsl} />
                </div>

                <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
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

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <SettingOutlined className="text-brand-500 dark:text-brand-400" />
                    Automated Email Notifications
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Turn individual automated notifications on or off. Each still requires SMTP to be enabled above to actually send email — in-app notifications go out regardless.
                </p>

                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                        <div>
                            <FormSwitch label="Upcoming MatchDay reminder" checked={notifyTournamentReminderEnabled} onChange={setNotifyTournamentReminderEnabled} />
                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Notifies every player before a MatchDay starts.</p>
                        </div>
                        <div className="w-40">
                            <FormInput
                                label="Days before"
                                type="number"
                                min={1}
                                max={30}
                                value={tournamentReminderDaysBefore}
                                onChange={(e) => setTournamentReminderDaysBefore(Number(e.target.value) || 1)}
                                disabled={!notifyTournamentReminderEnabled}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                        <div>
                            <FormSwitch label="Monthly payment due reminder" checked={notifyPaymentDueEnabled} onChange={setNotifyPaymentDueEnabled} />
                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Notifies players who haven't paid dues for the current month.</p>
                        </div>
                        <div className="w-40">
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
                    </div>

                    <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                        <FormSwitch label="Allow email on custom notifications" checked={notifyCustomEmailEnabled} onChange={setNotifyCustomEmailEnabled} />
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            When on, the "Also send email" option becomes available in the Notify button's Send Notification dialog.
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <BellOutlined className="text-brand-500 dark:text-brand-400" />
                    Push Notifications
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Master switch for browser/device push delivery. When off, nothing is pushed to any player's device regardless of their individual subscription — in-app notifications are unaffected.
                </p>

                <FormSwitch label="Enable push notifications" checked={pushNotificationsEnabled} onChange={setPushNotificationsEnabled} />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <FireOutlined className="text-brand-500 dark:text-brand-400" />
                    Auction
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Master switch for the player-auction feature. When off, the Auction nav entry and the "Auction Mode" toggle on MatchDay creation are hidden club-wide.
                </p>

                <FormSwitch label="Enable auction" checked={auctionEnabled} onChange={setAuctionEnabled} />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <BankOutlined className="text-brand-500 dark:text-brand-400" />
                    Accounting
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    Which chart of account every collection and bill payment posts to. Changing this here takes effect immediately — no restart needed. Leave unset to use the deployment default from appsettings.
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
                            {cashChartCode ? "Overriding the default." : `Currently using: ${data?.content?.cashChartName ?? data?.content?.cashChartCode ?? "—"} (default)`}
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
                            {collectionIncomeChartCode ? "Overriding the default." : `Currently using: ${data?.content?.collectionIncomeChartName ?? data?.content?.collectionIncomeChartCode ?? "—"} (default)`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <SkinOutlined className="text-brand-500 dark:text-brand-400" />
                    Jersey Colors
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    The club owns only 2 physical jerseys. These are the 2 colors available when
                    assigning a jersey to each team per match on the Next Match fixtures panel.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <JerseyColorPicker label="Jersey A" value={jerseyColorA} onChange={setJerseyColorA} />
                    <JerseyColorPicker label="Jersey B" value={jerseyColorB} onChange={setJerseyColorB} />
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
                    Next Match
                </h2>
                <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
                    A weekly club-wide match, created and announced automatically as soon as the previous one's date passes. Teams, jersey colors, and matches are managed from the Next Match page; every active player is notified to RSVP.
                </p>

                <div className="mb-5">
                    <FormSwitch label="Enable Next Match" checked={weeklyMatchEnabled} onChange={setWeeklyMatchEnabled} />
                </div>

                {weeklyMatchEnabled && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput
                        label="Name prefix"
                        placeholder="Next Match"
                        value={weeklyMatchNamePrefix}
                        onChange={(e) => setWeeklyMatchNamePrefix(e.target.value)}
                    />
                    <FormSelect
                        label="Day of week"
                        value={weeklyMatchDayOfWeek}
                        onChange={(e) => setWeeklyMatchDayOfWeek(e.target.value)}
                        options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))}
                    />
                    <FormInput
                        label="Time"
                        type="time"
                        value={weeklyMatchTime}
                        onChange={(e) => setWeeklyMatchTime(e.target.value)}
                    />
                    <FormSelect
                        label="Venue"
                        placeholder="Please select a venue"
                        value={weeklyMatchVenueId ?? ""}
                        disabled={isVenuesLoading}
                        onChange={(e) => setWeeklyMatchVenueId(Number(e.target.value))}
                        options={venuesData?.content.map((v: any) => ({ value: v.id, label: v.name })) || []}
                    />
                    <FormSelect
                        label="Sport"
                        value={weeklyMatchSportType}
                        onChange={(e) => setWeeklyMatchSportType(e.target.value)}
                        options={SPORT_TYPES.map((s) => ({ value: s, label: s }))}
                    />
                    <FormInput
                        label="Match duration (minutes)"
                        type="number"
                        min={15}
                        max={300}
                        value={weeklyMatchDurationMinutes}
                        onChange={(e) => setWeeklyMatchDurationMinutes(Number(e.target.value) || 90)}
                    />
                    <FormInput
                        label="Time gap between matches (minutes)"
                        type="number"
                        min={1}
                        max={120}
                        value={weeklyMatchTimeGapMinutes}
                        onChange={(e) => setWeeklyMatchTimeGapMinutes(Number(e.target.value) || 15)}
                    />
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
