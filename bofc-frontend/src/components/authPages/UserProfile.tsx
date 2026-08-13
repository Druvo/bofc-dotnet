import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import {
    PhoneOutlined,
    IdcardOutlined,
    MailOutlined,
    MessageOutlined,
    LockOutlined,
    EditOutlined,
    TrophyOutlined,
    HistoryOutlined,
    NumberOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    StarFilled,
    CrownOutlined,
} from "@ant-design/icons";
import companyLogo from "../../assets/logo.png";
import {
    useGetUserProfileQuery,
    useChangePasswordMutation,
    useUpdatePlayerDataMutation,
} from "../../state/features/auth/authSlice";
import {
    useGetPlayerPositionsQuery,
    useGetPlayerGoalkeepingHistoryQuery,
    useGetPlayerCaptainHistoryQuery,
} from "../../state/features/player/playerSlice";
import { useGetPlayerStatisticsQuery, useGetPlayerMatchHistoryQuery } from "../../state/features/statistics/statisticsSlice";
import { computeRating } from "../../utils/playerRating";
import { showBdLocalTime } from "../../utils/utils";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import useIsMobile from "../../hooks/useIsMobile";
import Avatar from "../CommonAtoms/Avatar";
import Button from "../ui/button";
import Tabs from "../ui/tabs";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";
import Loader from "../ui/loader";
import Badge from "../ui/badge";

export default function UserProfile() {
    const loginInfo = useSelector(selectLoginInfo);
    const isMobile = useIsMobile(576);

    const { id: routeId } = useParams();
    const navigate = useNavigate();
    const ownId = Number(loginInfo?.userId);
    const viewingId = routeId ? Number(routeId) : ownId;
    const isOwn = !routeId || viewingId === ownId;
    const profileQueryId = routeId ?? loginInfo?.userId;
    const isAdmin = (loginInfo?.roles || []).some((r) => r === "ADMIN" || r === "SUPERADMIN");

    const { data: playerProfileData, isLoading, refetch } = useGetUserProfileQuery({ id: profileQueryId }, { skip: !profileQueryId });
    const profile = playerProfileData?.content;

    const avatarSrc = toAbsolutePlayerPhotoUrl(profile?.photoUrl) || (isOwn ? loginInfo.image : undefined) || undefined;

    const { data: playerPositions } = useGetPlayerPositionsQuery();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
    const [updatePlayerData, { isLoading: isUpdating }] = useUpdatePlayerDataMutation();

    const { data: goalkeepingHistoryData, isLoading: isLoadingGoalkeeping } = useGetPlayerGoalkeepingHistoryQuery(
        { playerId: viewingId },
        { skip: !viewingId }
    );

    const { data: captainHistoryData, isLoading: isLoadingCaptain } = useGetPlayerCaptainHistoryQuery(
        { playerId: viewingId },
        { skip: !viewingId }
    );

    const { data: matchHistoryData, isLoading: isLoadingHistory } = useGetPlayerMatchHistoryQuery(
        { playerId: viewingId },
        { skip: !viewingId }
    );
    const [showAllHistory, setShowAllHistory] = useState(false);

    const { data: statsData } = useGetPlayerStatisticsQuery({ limit: 300 });
    const myStats = useMemo(
        () => statsData?.content?.find((s) => s.playerId === viewingId)?.statistics,
        [statsData, viewingId]
    );

    const [activeTab, setActiveTab] = useState(isOwn ? "edit" : "history");

    const [profileValues, setProfileValues] = useState({ name: "", email: "", employeeId: "", mobileNo: "", teamsId: "", playingPosition: "", jerseyNumber: "" });
    const [profileErrors, setProfileErrors] = useState<Partial<Record<string, string>>>({});

    useEffect(() => {
        if (profile) {
            setProfileValues({
                name: profile.name || "",
                email: profile.email || "",
                employeeId: profile.employeeId || "",
                mobileNo: profile.mobileNo || "",
                teamsId: profile.teamsId || "",
                playingPosition: profile.playingPosition || "",
                jerseyNumber: profile.jerseyNumber != null ? String(profile.jerseyNumber) : "",
            });
        }
    }, [profile]);

    const setProfileField = (key: keyof typeof profileValues, value: string) => setProfileValues((prev) => ({ ...prev, [key]: value }));

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleUpdateProfile = () => {
        const errors: Partial<Record<string, string>> = {};
        if (!profileValues.name.trim()) errors.name = "Name is required";
        if (!profileValues.email.trim()) errors.email = "Email is required";
        else if (!EMAIL_RE.test(profileValues.email)) errors.email = "Enter a valid email";
        if (profileValues.jerseyNumber) {
            const num = Number(profileValues.jerseyNumber);
            if (!Number.isInteger(num) || num < 1 || num > 99) errors.jerseyNumber = "Jersey number must be between 1 and 99";
        }
        setProfileErrors(errors);
        if (Object.keys(errors).length > 0) return;

        updatePlayerData({
            id: Number(loginInfo.userId),
            data: {
                ...profileValues,
                jerseyNumber: profileValues.jerseyNumber ? Number(profileValues.jerseyNumber) : undefined,
            },
        })
            .unwrap()
            .then(() => {
                toast.success("Profile updated successfully");
                refetch();
            })
            .catch((err: any) => {
                toast.error(err?.data?.message || "Failed to update profile");
            });
    };

    const [passwordValues, setPasswordValues] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordErrors, setPasswordErrors] = useState<Partial<Record<string, string>>>({});

    const handleChangePassword = () => {
        const errors: Partial<Record<string, string>> = {};
        if (!passwordValues.oldPassword) errors.oldPassword = "Enter your current password";
        if (!passwordValues.newPassword) errors.newPassword = "Enter a new password";
        else if (passwordValues.newPassword.length < 6) errors.newPassword = "Password must be at least 6 characters";
        if (!passwordValues.confirmPassword) errors.confirmPassword = "Confirm your new password";
        else if (passwordValues.confirmPassword !== passwordValues.newPassword) errors.confirmPassword = "Passwords do not match";
        setPasswordErrors(errors);
        if (Object.keys(errors).length > 0) return;

        changePassword({ oldPassword: passwordValues.oldPassword, newPassword: passwordValues.newPassword })
            .unwrap()
            .then(() => {
                toast.success("Password updated successfully");
                setPasswordValues({ oldPassword: "", newPassword: "", confirmPassword: "" });
            })
            .catch((err: any) => {
                toast.error(err?.data?.message || "Failed to update password");
            });
    };

    const heroStat = (label: string, value: number, accent: string) => (
        <div className="relative min-w-[84px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 px-4 pb-2.5 pt-3.5 text-center backdrop-blur dark:border-white/15 dark:bg-white/10">
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
            <div className="text-[28px] font-extrabold leading-tight text-gray-800 dark:text-white">{value}</div>
            <div className="text-[10.5px] uppercase tracking-wide text-gray-500 dark:text-white/70">{label}</div>
        </div>
    );

    const infoRow = (icon: React.ReactNode, label: string, value?: string) => (
        <div className="flex items-center gap-3 py-2.5">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-base text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                {icon}
            </div>
            <div className="flex min-w-0 flex-col">
                <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
                <span className={`truncate text-theme-sm ${value ? "text-gray-800 dark:text-white/90" : "text-gray-400"}`}>{value || "-"}</span>
            </div>
        </div>
    );

    const disciplineTile = (label: string, value: number, color: string) => (
        <div className="flex flex-1 items-center gap-2.5 rounded-[10px] border border-l-[3px] border-gray-200 bg-white px-3 py-2.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]" style={{ borderLeftColor: color }}>
            <span className="text-[22px] font-extrabold" style={{ color }}>{value}</span>
            <span className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</span>
        </div>
    );

    const history = matchHistoryData?.content ?? [];
    const record = history.reduce(
        (acc, m) => {
            if (m.result === "WIN") acc.w += 1;
            else if (m.result === "DRAW") acc.d += 1;
            else acc.l += 1;
            return acc;
        },
        { w: 0, d: 0, l: 0 }
    );
    const visibleHistory = showAllHistory ? history : history.slice(0, 10);
    const resultColor = (r: string) => (r === "WIN" ? "#12b76a" : r === "LOSS" ? "#E0736B" : "#8792A8");
    const resultLetter = (r: string) => (r === "WIN" ? "W" : r === "LOSS" ? "L" : "D");

    const editTab = (
        <div className="max-w-[560px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput label="Name" placeholder="Full name" value={profileValues.name} onChange={(e) => setProfileField("name", e.target.value)} error={profileErrors.name} />
                <FormInput label="Email" placeholder="Email" value={profileValues.email} onChange={(e) => setProfileField("email", e.target.value)} error={profileErrors.email} />
                <FormInput label="Employee ID" placeholder="Employee ID" value={profileValues.employeeId} onChange={(e) => setProfileField("employeeId", e.target.value)} />
                <FormInput label="Mobile No" placeholder="Mobile number" value={profileValues.mobileNo} onChange={(e) => setProfileField("mobileNo", e.target.value)} />
                <FormInput label="Teams ID" placeholder="Teams ID" value={profileValues.teamsId} onChange={(e) => setProfileField("teamsId", e.target.value)} />
                <FormSelect
                    label="Playing Position"
                    placeholder="Select position"
                    value={profileValues.playingPosition}
                    onChange={(e) => setProfileField("playingPosition", e.target.value)}
                    options={playerPositions?.content?.map((position) => ({ value: position.name, label: position.description })) || []}
                />
                <FormInput
                    type="number"
                    label="Jersey Number"
                    placeholder="e.g. 10"
                    min={1}
                    max={99}
                    value={profileValues.jerseyNumber}
                    onChange={(e) => setProfileField("jerseyNumber", e.target.value)}
                    error={profileErrors.jerseyNumber}
                />
            </div>
            <Button type="button" className="mt-4" disabled={isUpdating} onClick={handleUpdateProfile}>Save Changes</Button>
        </div>
    );

    const passwordTab = (
        <div className="max-w-[400px]">
            <div className="flex flex-col gap-4">
                <FormInput type="password" label="Current Password" placeholder="Current password" value={passwordValues.oldPassword} onChange={(e) => setPasswordValues((p) => ({ ...p, oldPassword: e.target.value }))} error={passwordErrors.oldPassword} />
                <FormInput type="password" label="New Password" placeholder="New password" value={passwordValues.newPassword} onChange={(e) => setPasswordValues((p) => ({ ...p, newPassword: e.target.value }))} error={passwordErrors.newPassword} />
                <FormInput type="password" label="Confirm New Password" placeholder="Confirm new password" value={passwordValues.confirmPassword} onChange={(e) => setPasswordValues((p) => ({ ...p, confirmPassword: e.target.value }))} error={passwordErrors.confirmPassword} />
            </div>
            <Button type="button" className="mt-4" disabled={isChangingPassword} onClick={handleChangePassword}>Update Password</Button>
        </div>
    );

    const historyTab = isLoadingHistory ? (
        <Loader className="py-10" />
    ) : history.length === 0 ? (
        <p className="py-10 text-center text-theme-sm text-gray-400 dark:text-gray-500">No match history yet</p>
    ) : (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-theme-sm text-gray-500 dark:text-gray-400">Played <strong className="text-gray-800 dark:text-white/90">{history.length}</strong> matches</span>
                    <div className="flex items-center gap-1.5">
                        <Badge variant="success">{record.w}W</Badge>
                        <Badge variant="light">{record.d}D</Badge>
                        <Badge variant="error">{record.l}L</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-theme-xs text-gray-400">Recent form</span>
                    {history.slice(0, 5).map((m, i) => (
                        <span
                            key={i}
                            title={`${m.result} vs ${m.opponentTeamName ?? ""}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-theme-xs font-bold text-white"
                            style={{ background: resultColor(m.result) }}
                        >
                            {resultLetter(m.result)}
                        </span>
                    ))}
                </div>
            </div>

            {visibleHistory.map((m, idx) => {
                const rc = resultColor(m.result);
                const contrib = [
                    m.goalsScored > 0 && { icon: "⚽", n: m.goalsScored, label: "Goals" },
                    m.assists > 0 && { icon: "🅰️", n: m.assists, label: "Assists" },
                    m.yellowCards > 0 && { icon: "🟨", n: m.yellowCards, label: "Yellow" },
                    m.redCards > 0 && { icon: "🟥", n: m.redCards, label: "Red" },
                ].filter(Boolean) as { icon: string; n: number; label: string }[];

                return (
                    <div key={`${m.matchId}-${idx}`} className="mb-2.5 flex overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                        <div className="w-1 shrink-0" style={{ background: rc }} />
                        <div className="min-w-0 flex-1 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: rc }}>
                                    {resultLetter(m.result)}
                                </span>
                                <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                                    <span className="truncate text-theme-base font-semibold text-brand-500 dark:text-brand-400">{m.teamName || "My Team"}</span>
                                    <span title="Your team" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                </div>
                                <span
                                    className="shrink-0 rounded-lg px-3 py-0.5 text-center text-[17px] font-extrabold"
                                    style={{ color: rc, background: `${rc}1f`, border: `1px solid ${rc}59`, minWidth: 62 }}
                                >
                                    {m.teamScore} - {m.opponentScore}
                                </span>
                                <span className="flex-1 truncate text-theme-base text-gray-500 dark:text-gray-400">{m.opponentTeamName || "-"}</span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2.5 pl-[42px]">
                                <span className="text-theme-xs text-gray-400">
                                    {m.matchDayName ? `${m.matchDayName} · ` : ""}
                                    {showBdLocalTime(m.matchDate)}
                                </span>
                                {contrib.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {contrib.map((c) => (
                                            <span key={c.label} title={c.label} className="rounded-md bg-gray-100 px-2 py-0.5 text-theme-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                                                {c.icon} {c.n}
                                            </span>
                                        ))}
                                        {m.minutesPlayed > 0 && <span className="text-theme-xs text-gray-400">{m.minutesPlayed}'</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {history.length > 10 && (
                <div className="mt-2 text-center">
                    <button type="button" onClick={() => setShowAllHistory((v) => !v)} className="text-theme-sm font-medium text-brand-500 hover:underline">
                        {showAllHistory ? "Show less" : `Show all ${history.length} matches`}
                    </button>
                </div>
            )}
        </div>
    );

    const goalkeepingTab = isLoadingGoalkeeping ? (
        <Loader className="py-10" />
    ) : goalkeepingHistoryData?.content && goalkeepingHistoryData.content.length > 0 ? (
        <div>
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">
                You have played as goalkeeper <strong className="text-gray-800 dark:text-white/90">{goalkeepingHistoryData.content.length}</strong> times.
            </span>
            <div className="relative mt-5 flex flex-col gap-4 border-l-2 border-gray-100 pl-5 dark:border-[var(--color-rule)]">
                {goalkeepingHistoryData.content.map((record, index) => (
                    <div key={index} className="relative">
                        <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-warning-500 dark:bg-[var(--color-paper-3)]">
                            <TrophyOutlined className="text-xs" />
                        </span>
                        <div className="rounded-lg border border-gray-100 px-3.5 py-2.5 dark:border-[var(--color-rule)]">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-800 dark:text-white/90">
                                    {record.matchDayName || `Round ${record.roundNumber}`}
                                </span>
                                <span className="text-theme-xs text-gray-400">#{goalkeepingHistoryData.content.length - index}</span>
                            </div>
                            <span className="text-theme-sm text-gray-400">
                                {record.venueName && `${record.venueName} · `}
                                {showBdLocalTime(record.playedDate)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <p className="py-10 text-center text-theme-sm text-gray-400 dark:text-gray-500">No goalkeeping history yet</p>
    );

    const captainTab = isLoadingCaptain ? (
        <Loader className="py-10" />
    ) : captainHistoryData?.content && captainHistoryData.content.length > 0 ? (
        <div>
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">
                You have captained <strong className="text-gray-800 dark:text-white/90">{captainHistoryData.content.length}</strong> {captainHistoryData.content.length === 1 ? "time" : "times"}.
            </span>
            <div className="relative mt-5 flex flex-col gap-4 border-l-2 border-gray-100 pl-5 dark:border-[var(--color-rule)]">
                {captainHistoryData.content.map((record, index) => (
                    <div key={index} className="relative">
                        <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-warning-500 dark:bg-[var(--color-paper-3)]">
                            <CrownOutlined className="text-xs" />
                        </span>
                        <div className="rounded-lg border border-gray-100 px-3.5 py-2.5 dark:border-[var(--color-rule)]">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-800 dark:text-white/90">{record.matchDayName}</span>
                                <span className="text-theme-xs text-gray-400">#{captainHistoryData.content.length - index}</span>
                            </div>
                            <span className="text-theme-sm text-gray-400">{record.teamName} - {showBdLocalTime(record.matchDayDate)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <p className="py-10 text-center text-theme-sm text-gray-400 dark:text-gray-500">No captain history yet</p>
    );

    const allTabs = [
        { key: "edit", label: <span className="flex items-center gap-1.5"><EditOutlined /> Edit Profile</span>, content: editTab },
        { key: "password", label: <span className="flex items-center gap-1.5"><LockOutlined /> Change Password</span>, content: passwordTab },
        { key: "history", label: <span className="flex items-center gap-1.5"><HistoryOutlined /> Match History</span>, content: historyTab },
        { key: "goalkeeping", label: <span className="flex items-center gap-1.5"><TrophyOutlined /> Goalkeeping History</span>, content: goalkeepingTab },
        { key: "captain", label: <span className="flex items-center gap-1.5"><CrownOutlined /> Captain History</span>, content: captainTab },
    ];
    const visibleTabs = allTabs.filter((t) => isOwn || t.key === "history" || t.key === "goalkeeping" || t.key === "captain");
    const currentTab = visibleTabs.find((t) => t.key === activeTab) || visibleTabs[0];

    return (
        <div className="flex flex-col gap-4">
            {/* Hero header */}
            <div className="overflow-hidden rounded-2xl">
                <div
                    className={`relative border border-[#2f6b45] ${isMobile ? "px-4 pb-7 pt-6" : "px-8 py-8"}`}
                    style={{
                        background: `
                            radial-gradient(circle at 16% 28%, rgba(47,107,69,0.16), transparent 45%),
                            radial-gradient(circle at 88% 115%, rgba(47,107,69,0.10), transparent 45%),
                            var(--color-paper-3)
                        `,
                    }}
                >
                    <img
                        src={companyLogo}
                        alt=""
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-[0.07]"
                        style={{ right: isMobile ? 8 : 28, height: isMobile ? 120 : 200 }}
                    />

                    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-brand-500 via-brand-400 to-transparent" />

                    <div className={`relative flex flex-wrap items-center gap-4 ${isMobile ? "justify-center" : "justify-start"}`} style={{ gap: isMobile ? 16 : 24 }}>
                        <div className="relative shrink-0 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 p-[3px]" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>
                            <Avatar
                                src={avatarSrc}
                                name={profile?.name || loginInfo.username}
                                seed={viewingId}
                                size={isMobile ? 92 : 112}
                                fontSize={isMobile ? 30 : 36}
                                className="border-[3px] border-[var(--color-paper-3)]"
                            />
                            {profile?.active && (
                                <span title="Active player" className="absolute bottom-1.5 right-1.5 h-[18px] w-[18px] rounded-full border-[3px] border-[var(--color-paper-3)] bg-success-500" />
                            )}
                        </div>

                        <div className={`min-w-0 flex-1 ${isMobile ? "text-center" : "text-left"}`} style={{ minWidth: isMobile ? 0 : 220 }}>
                            <h2 className={`m-0 font-bold text-gray-800 dark:text-white ${isMobile ? "text-2xl" : "text-3xl"}`}>{profile?.name || loginInfo.username}</h2>
                            {isOwn && <div className="mt-0.5 text-theme-sm text-gray-500 dark:text-white/60">{profile?.email || loginInfo.email}</div>}
                            <div className={`mt-3 flex flex-wrap items-center gap-2 ${isMobile ? "justify-center" : "justify-start"}`}>
                                {profile?.playingPosition && (
                                    <span className="rounded-full bg-brand-500 px-3 py-0.5 text-theme-xs font-bold tracking-wide text-white">{profile.playingPosition}</span>
                                )}
                                {isOwn && loginInfo?.roles?.filter(Boolean).map((r) => (
                                    <span key={r} className="rounded-full border border-gray-200 bg-gray-100 px-3 py-0.5 text-theme-xs text-gray-700 dark:border-white/20 dark:bg-white/10 dark:text-white">{r}</span>
                                ))}
                                {!isOwn && isAdmin && (
                                    <Button type="button" variant="outline" size="sm" startIcon={<EditOutlined />} onClick={() => navigate(`/players/${routeId}/edit`)}>
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className={isMobile ? "grid w-full grid-cols-2 gap-2.5" : "flex flex-wrap gap-2.5"}>
                            {heroStat("Matches", myStats?.matchesPlayed ?? 0, "#b69549")}
                            {heroStat("Goals", myStats?.goalsScored ?? 0, "#12b76a")}
                            {heroStat("Assists", myStats?.assists ?? 0, "#0ba5ec")}
                            {heroStat("G+A", myStats?.goalsAndAssists ?? 0, "#f79009")}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:col-span-1">
                    <h5 className="mb-2 text-base font-bold text-gray-800 dark:text-white/90">Player Details</h5>
                    {isLoading ? (
                        <Loader className="py-8" />
                    ) : (
                        <>
                            {(isOwn || isAdmin) && infoRow(<MailOutlined />, "Email", profile?.email || loginInfo.email)}
                            {(isOwn || isAdmin) && infoRow(<PhoneOutlined />, "Mobile", profile?.mobileNo)}
                            {infoRow(<IdcardOutlined />, "Employee ID", profile?.employeeId)}
                            {(isOwn || isAdmin) && infoRow(<MessageOutlined />, "Teams", profile?.teamsId)}
                            {infoRow(<NumberOutlined />, "Jersey Number", profile?.jerseyNumber != null ? `#${profile.jerseyNumber}` : undefined)}
                            {infoRow(<CheckCircleOutlined />, "Status", profile ? (profile.active ? "Active" : "Inactive") : undefined)}
                            {isAdmin && !!profile?.roles?.length && (
                                <div className="flex items-center gap-3 py-2.5">
                                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-base text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                        <SafetyCertificateOutlined />
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <span className="text-[11px] uppercase tracking-wide text-gray-400">Roles</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.roles.map((r) => <Badge key={r.id} variant="light">{r.name}</Badge>)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {myStats && (
                                <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                    <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Performance Rating</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-extrabold text-brand-500 dark:text-brand-400">{computeRating(myStats).toFixed(1)}</span>
                                        <span className="flex">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <StarFilled
                                                    key={i}
                                                    className="text-sm"
                                                    style={{ color: i < Math.round(computeRating(myStats) / 2) ? "#B69549" : "#D1D5DB" }}
                                                />
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-[var(--color-rule)]">
                                <span className="text-[11px] uppercase tracking-wide text-gray-400">Disciplinary Record</span>
                                <div className="mt-2 flex gap-2.5">
                                    {disciplineTile("Yellow Cards", myStats?.yellowCards ?? 0, "#f79009")}
                                    {disciplineTile("Red Cards", myStats?.redCards ?? 0, "#f04438")}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:col-span-2">
                    <Tabs items={visibleTabs.map((t) => ({ key: t.key, label: t.label }))} active={activeTab} onChange={setActiveTab} />
                    <div className="mt-4">{currentTab?.content}</div>
                </div>
            </div>
        </div>
    );
}
