import { TrophyOutlined, CloseOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import SettingsModal from "../CommonAtoms/SettingsModal";
import Dashboard from "../Dashboard/DashboardComponent";
import Player from "../Player/Player";
import Players from "../Player/Players";
import PlayerStatistics from "../Player/PlayerStatistics";
import JoinTournament from "../Tournaments/JoinTournament";
import SingleTournament from "../Tournaments/SingleTournament";
import TournamentsPage from "../Tournaments/TournamentsPage";
import Venue from "../Venue/Venue";
import ContentOutlet from "./ContentOutlet";
import { useAppShell } from "../layout/AppShellContext";
import ClubRules from "../ClubRules/ClubRules";
import MatchDetailsPage from "../Tournaments/Fixtures/MatchDetailsPage";
import {
  AuctionHubPage,
  AuctionRegistrationPage,
  AuctionAdminApprovalPage,
  AuctionSettingsPage,
  AuctionPlayerPoolPage,
  AuctionTeamBudgetsPage,
  LiveAuctionPage,
  AuctionResultsPage,
} from "../Auction";
import TournamentViewerPage from "../TournamentViewer/TournamentViewerPage";
import NotificationsPage from "../Notifications/NotificationsPage";
import AppFooter from "../CommonAtoms/AppFooter";
import MobileTabBar from "./MobileTabBar";
import { useGetMyGoalkeepingHistoryQuery } from "../../state/features/player/playerSlice";
import { showBdLocalTime } from "../../utils/utils";
import Loader from "../ui/loader";

interface ContentComponentProps {
    onToggleCollapse: (value: boolean) => void;
    collapsed: boolean;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
}

const ContentComponent: React.FC<ContentComponentProps> = ({
    onToggleCollapse,
    collapsed,
    isDarkMode,
    setIsDarkMode,
}) => {
    const loginInfo = useSelector(selectLoginInfo);
    const [isMobile, setIsMobile] = useState(false);
    const appShell = useAppShell();

    const { user } = useAuthHook();
    const dispatch = useDispatch();

    const { data: playerProfileData, refetch } = useGetUserProfileQuery({
        id: loginInfo?.userId || "",
    }, {
        skip: !loginInfo?.userId
    });

    const {
        data: goalkeepingHistoryData,
        isLoading: isLoadingGoalkeepingHistory,
        refetch: refetchGoalkeepingHistory
    } = useGetMyGoalkeepingHistoryQuery();

    // Settings modal and the goalkeeping-history drawer are now opened from
    // the TailAdmin Header (via AppShellContext) rather than a dropdown menu
    // built here — this component still owns the actual query data/refetch,
    // since it's what the Drawer/Modal below render.
    const handleModalClose = () => {
        refetch();
        appShell.closeSettingsModal();
    };

    useEffect(() => {
        if (appShell.goalkeepingHistoryOpen) {
            refetchGoalkeepingHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appShell.goalkeepingHistoryOpen]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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
                    // Leaves room for the fixed mobile bottom tab bar so it
                    // doesn't cover the last bit of page content.
                    paddingBottom: isMobile ? 58 : 0,
                }}
            >
                        <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<ContentOutlet />}>
                            <Route index element={<Dashboard isDarkMode={isDarkMode} />} />
                            <Route
                                path="/tournament-viewer"
                                element={<TournamentViewerPage />}
                            />
                            <Route
                                path="/tournament-viewer/:tournamentId"
                                element={<TournamentViewerPage />}
                            />
                            <Route
                                path="/tournament-viewer/:tournamentId/:tab"
                                element={<TournamentViewerPage />}
                            />
                            <Route
                                path="/dashboard"
                                element={<Dashboard isDarkMode={isDarkMode} />}
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
                            <Route path="/players" element={<Players />} />
                            <Route path="/player-statistics" element={<PlayerStatistics />} />
                            <Route
                                path="/tournaments"
                                element={<TournamentsPage />}
                            />
                            <Route
                                path="/tournaments/team-building/:id"
                                element={<SingleTournament />}
                            />
                            <Route
                                path="/tournaments/join-tournament/:id"
                                element={<JoinTournament />}
                            />
                            <Route
                                path="/fixtures/:matchId"
                                element={<MatchDetailsPage />}
                            />
                            <Route path="venues" element={<Venue />} />
                            <Route
                                path="ac/voucher-types"
                                element={<AcVoucherType />}
                            />
                            <Route path="/ac/natures" element={<AcNature />} />
                            <Route
                                path="ac/collections"
                                element={<AcCollection />}
                            />
                            <Route
                                path="ac/bill-payments"
                                element={<AcBillPayment />}
                            />
                            <Route path="ac/charts" element={<AcChart />} />
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
                            <Route
                                path="ac/vouchers"
                                element={<AcVouchers />}
                            />
                            {/* <Route path="ac/vouchers/:id" element={<AcVoucher />} /> */}

                            <Route path="club-rules" element={<ClubRules />} />

                            {/* Auction Routes */}
                            <Route path="auction" element={<AuctionHubPage />} />
                            <Route path="auction/register/:tournamentId" element={<AuctionRegistrationPage />} />
                            <Route path="auction/registrations/:tournamentId" element={<AuctionAdminApprovalPage />} />
                            <Route path="auction/settings/:tournamentId" element={<AuctionSettingsPage />} />
                            <Route path="auction/players/:tournamentId" element={<AuctionPlayerPoolPage />} />
                            <Route path="auction/team-budgets/:tournamentId" element={<AuctionTeamBudgetsPage />} />
                            <Route path="auction/live/:tournamentId" element={<LiveAuctionPage />} />
                            <Route path="auction/results/:tournamentId" element={<AuctionResultsPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    {playerProfileData && loginInfo?.userId && (
                        <SettingsModal
                            visible={appShell.settingsModalOpen}
                            onClose={handleModalClose}
                            playerData={{
                                id: playerProfileData?.content?.id,
                                name: playerProfileData?.content?.name,
                                email: playerProfileData?.content?.email,
                                employeeId:
                                    playerProfileData?.content?.employeeId,
                                fullName: playerProfileData?.content?.fullName,
                                teamsId: playerProfileData?.content?.teamsId,
                                mobileNo: playerProfileData?.content?.mobileNo,
                                playingPosition:
                                    playerProfileData?.content?.playingPosition,
                            }}
                        />
                    )}
                        </div>
                        <AppFooter />
            </div>
                {isMobile && user?.token && (
                    <MobileTabBar onOpenMore={() => onToggleCollapse(false)} />
                )}

            {/* Goalkeeping History Drawer */}
            {appShell.goalkeepingHistoryOpen && (
                <div className="fixed inset-0 z-modal">
                    <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[2px] dark:bg-gray-900/50" onClick={appShell.closeGoalkeepingHistory} />
                    <div
                        className="fixed right-0 top-0 h-full overflow-y-auto bg-white shadow-theme-lg dark:bg-gray-900"
                        style={{ width: isMobile ? '100%' : 480, padding: 24 }}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrophyOutlined style={{ color: '#faad14' }} />
                                <span className="text-lg font-semibold text-gray-800 dark:text-white/90">My Goalkeeping History</span>
                            </div>
                            <button
                                onClick={appShell.closeGoalkeepingHistory}
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
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
