import { TrophyOutlined, CloseOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import useIsMobile from "../../hooks/useIsMobile";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthHook } from "../../hooks/useAuthHook";
import { useGetUserProfileQuery } from "../../state/features/auth/authSlice";
import { selectLoginInfo, setImage } from "../../state/slices/loginInfoSlice";
import { API_URL } from "../../settings";
import AcBillPayment from "../Account/BillPayment/AcBillPayment";
import AcCollection from "../Account/Collection/AcCollection";
import AcChart from "../Account/Configuration/AcChart";
import AcNature from "../Account/Configuration/AcNature";
import AcVoucherType from "../Account/Configuration/AcVoucherType";
import AccountBalanceSheet from "../Account/Report/AccountBalanceSheet";
import AccountBalanceSummary from "../Account/Report/AccountBalanceSummary";
import AccountsReport from "../Account/Report/AccountReport";
import AcVouchers from "../Account/Voucher/AcVouchers";
import UserProfile from "../authPages/UserProfile";
import Dashboard from "../Dashboard/DashboardComponent";
import Player from "../Player/Player";
import Players from "../Player/Players";
import PlayerRankBoard from "../Player/PlayerRankBoard";
import PlayerStatistics from "../Player/PlayerStatistics";
import JoinMatchDay from "../MatchDays/JoinMatchDay";
import SingleMatchDay from "../MatchDays/SingleMatchDay";
import MatchDaysPage from "../MatchDays/MatchDaysPage";
import Venue from "../Venue/Venue";
import ContentOutlet from "./ContentOutlet";
import { useAppShell } from "../layout/AppShellContext";
import ClubRules from "../ClubRules/ClubRules";
import GlobalSettingsPage from "../Settings/SettingsPage";
import EmailTemplatesPage from "../Settings/EmailTemplatesPage";
import MonthlyPaymentsPage from "../Dashboard/MonthlyPaymentsPage";
import MatchDayPage from "../MatchDay/MatchDayPage";
import MatchDetailsPage from "../MatchDays/Fixtures/MatchDetailsPage";
import MatchDayViewerPage from "../MatchDayViewer/MatchDayViewerPage";
import NotificationsPage from "../Notifications/NotificationsPage";
import AppFooter from "../CommonAtoms/AppFooter";
import MobileTabBar from "./MobileTabBar";
import { useGetMyGoalkeepingHistoryQuery } from "../../state/features/player/playerSlice";
import { showBdLocalTime } from "../../utils/utils";
import Loader from "../ui/loader";

interface ContentComponentProps {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
}

const ContentComponent: React.FC<ContentComponentProps> = ({
    isDarkMode,
    setIsDarkMode,
}) => {
    const loginInfo = useSelector(selectLoginInfo);
    // <lg (1024px) - matches the bottom tab bar / off-canvas nav drawer's own
    // breakpoint (tailwind.config.js's `lg`), not the old <768 split. Computed
    // synchronously on first render (useIsMobile reads window.innerWidth in its
    // initial useState, not after a mount effect) - a useEffect-based version
    // previously defaulted to "desktop" for one frame on every real mobile
    // load before flipping true, which is exactly the wrong-state flash this
    // kind of check needs to avoid.
    const showMobileNav = useIsMobile(1023);
    const appShell = useAppShell();

    const { user } = useAuthHook();
    const dispatch = useDispatch();

    const { data: playerProfileData } = useGetUserProfileQuery({
        id: loginInfo?.userId || "",
    }, {
        skip: !loginInfo?.userId
    });

    const {
        data: goalkeepingHistoryData,
        isLoading: isLoadingGoalkeepingHistory,
        refetch: refetchGoalkeepingHistory
    } = useGetMyGoalkeepingHistoryQuery();

    // The goalkeeping-history drawer is opened from the TailAdmin Header (via
    // AppShellContext) rather than a dropdown menu built here - this component still
    // owns the actual query data/refetch, since it's what the Drawer below renders.
    useEffect(() => {
        if (appShell.goalkeepingHistoryOpen) {
            refetchGoalkeepingHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appShell.goalkeepingHistoryOpen]);

    // Sync the real profile photo into the store so the header avatar and the
    // sidebar footer (both read loginInfo.image) show the user's actual photo.
    useEffect(() => {
        const photoUrl = playerProfileData?.content?.photoUrl;
        if (!photoUrl) return;
        const src = photoUrl.startsWith("http")
            ? photoUrl
            : `${API_URL}${photoUrl}`;
        dispatch(setImage(src));
    }, [playerProfileData, dispatch]);

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                    // Leaves room for the fixed mobile/tablet bottom tab bar
                    // (plus the iOS safe-area inset it itself pads for) so it
                    // doesn't cover the last bit of page content.
                    paddingBottom: showMobileNav ? "var(--app-bottombar-h)" : 0,
                }}
            >
                        <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<ContentOutlet />}>
                            <Route index element={<Dashboard />} />
                            <Route
                                path="/match-day-viewer"
                                element={<MatchDayViewerPage />}
                            />
                            <Route
                                path="/match-day-viewer/:matchDayId"
                                element={<MatchDayViewerPage />}
                            />
                            <Route
                                path="/match-day-viewer/:matchDayId/:tab"
                                element={<MatchDayViewerPage />}
                            />
                            <Route
                                path="/dashboard"
                                element={<Dashboard />}
                            />
                            <Route path="/profile" element={<UserProfile />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/player" element={<Player />} />
                            {/* Any logged-in user can view a player's read-only profile */}
                            <Route path="/players/:id" element={<UserProfile />} />
                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                <Route
                                    path="/players/:id/edit"
                                    element={<Player />}
                                />
                            )}
                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                <Route path="/players/ranks" element={<PlayerRankBoard />} />
                            )}
                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                <Route path="/players/monthly-payments" element={<MonthlyPaymentsPage />} />
                            )}
                            <Route path="/players" element={<Players />} />
                            <Route path="/player-statistics" element={<PlayerStatistics />} />
                            <Route
                                path="/match-days"
                                element={<MatchDaysPage />}
                            />
                            <Route
                                path="/match-days/team-building/:id"
                                element={<SingleMatchDay />}
                            />
                            <Route
                                path="/match-days/join-match-day/:id"
                                element={<JoinMatchDay />}
                            />
                            <Route
                                path="/fixtures/:matchId"
                                element={<MatchDetailsPage />}
                            />
                            <Route path="venues" element={<Venue />} />
                            {/* AcVoucherType/AcNature/AcChart/AcVouchers all fetch on mount from
                                controllers restricted to Admin/SuperAdmin only - gating the route
                                (not just hiding the Sidebar link) keeps a direct URL nav from
                                403-ing for every other role. */}
                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                <>
                                    <Route
                                        path="ac/voucher-types"
                                        element={<AcVoucherType />}
                                    />
                                    <Route path="/ac/natures" element={<AcNature />} />
                                    <Route path="ac/charts" element={<AcChart />} />
                                    <Route
                                        path="ac/vouchers"
                                        element={<AcVouchers />}
                                    />
                                </>
                            )}
                            {/* AcCollection/AcBillPayment read endpoints allow Admin/SuperAdmin/Player
                                (financial transparency for players), unlike the config pages above. */}
                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") || loginInfo.roles.includes("PLAYER")) && (
                                <>
                                    <Route
                                        path="ac/collections"
                                        element={<AcCollection />}
                                    />
                                    <Route
                                        path="ac/bill-payments"
                                        element={<AcBillPayment />}
                                    />
                                </>
                            )}
                            <Route
                                path="ac/reports/accounts-summary"
                                element={<AccountsReport />}
                            />
                            <Route
                                path="ac/reports/balance-summary"
                                element={<AccountBalanceSummary />}
                            />
                            <Route
                                path="/ac/reports/balance-sheet"
                                element={<AccountBalanceSheet />}
                            />
                            {/* <Route path="ac/voucher" element={<AcVoucher />} /> */}
                            {/* <Route path="ac/vouchers/:id" element={<AcVoucher />} /> */}

                            <Route path="club-rules" element={<ClubRules />} />

                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                <>
                                    <Route path="settings" element={<GlobalSettingsPage />} />
                                    <Route path="settings/email-templates" element={<EmailTemplatesPage />} />
                                </>
                            )}

                            <Route path="match-day" element={<MatchDayPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                        </div>
                        <AppFooter />
            </div>
                {showMobileNav && user?.token && (
                    <MobileTabBar onOpenMore={() => appShell.openSidebar()} />
                )}

            {/* Goalkeeping History Drawer */}
            {appShell.goalkeepingHistoryOpen && (
                <div className="fixed inset-0 z-modal">
                    <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[2px] dark:bg-[var(--color-paper-3)]/50" onClick={appShell.closeGoalkeepingHistory} />
                    <div
                        className="fixed right-0 top-0 h-full overflow-y-auto bg-white shadow-theme-lg dark:bg-[var(--color-paper-3)]"
                        style={{ width: showMobileNav ? '100%' : 480, padding: 24 }}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrophyOutlined style={{ color: '#faad14' }} />
                                <span className="text-lg font-semibold text-gray-800 dark:text-white/90">My Goalkeeping History</span>
                            </div>
                            <button
                                onClick={appShell.closeGoalkeepingHistory}
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:bg-[var(--color-paper-2)] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <CloseOutlined />
                            </button>
                        </div>

                        {isLoadingGoalkeepingHistory ? (
                            <Loader className="py-10" />
                        ) : goalkeepingHistoryData?.content && goalkeepingHistoryData.content.length > 0 ? (
                            <div>
                                <div style={{
                                    marginBottom: 24,
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(24, 144, 255, 0.2)'
                                }}>
                                    <h5 className="m-0 mb-2 text-base font-semibold text-gray-800 dark:text-white/90">
                                        Summary
                                    </h5>
                                    <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                                        You have played as goalkeeper <strong>{goalkeepingHistoryData.content.length}</strong> times.
                                    </span>
                                </div>

                                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {goalkeepingHistoryData.content.map((record, index) => (
                                        <div key={index} style={{ display: 'flex', gap: 12 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <TrophyOutlined style={{ fontSize: '16px', color: '#faad14' }} />
                                                {index < goalkeepingHistoryData.content.length - 1 && (
                                                    <div style={{ width: 1, flex: 1, background: '#f0f0f0', minHeight: 24, marginTop: 4 }} />
                                                )}
                                            </div>
                                            <div style={{
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid #f0f0f0',
                                                marginBottom: 16,
                                                flex: 1,
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: 4
                                                }}>
                                                    <span className="text-base font-semibold text-gray-800 dark:text-white/90">
                                                        Round {record.roundNumber}
                                                    </span>
                                                    <span className="text-theme-xs text-gray-400 dark:text-gray-500">
                                                        #{goalkeepingHistoryData.content.length - index}
                                                    </span>
                                                </div>
                                                <span className="text-theme-sm text-gray-500 dark:text-gray-400">
                                                    {showBdLocalTime(record.playedDate)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center" style={{ padding: '40px 0' }}>
                                <TrophyOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                                <h4 className="mt-4 text-lg font-semibold text-gray-400 dark:text-gray-500">
                                    No Goalkeeping History
                                </h4>
                                <span className="text-theme-sm text-gray-400 dark:text-gray-500">
                                    You haven't played as a goalkeeper yet. Keep playing and this section will show your goalkeeping records!
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};


export default ContentComponent;
