import { ConfigProvider, theme } from "antd";
import { useEffect, useLayoutEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./styles/toastStyles.css";
import ContentComponent from "./components/Content/ContentComponent";
import DefaultLayout from "./components/layout/DefaultLayout";
import TournamentViewerPage from "./components/TournamentViewer/TournamentViewerPage";
import { useAuthHook } from "./hooks/useAuthHook";
import { checkTockenValidity } from "./utils/utils";
import LoginPage from "./components/authPages/LoginPage";
import PasswordResetPage from "./components/authPages/PasswordResetPage";
import { useDispatch, useSelector } from "react-redux";
import { selectResetPassword } from "./state/slices/loginInfoSlice";
import { AuctionRegistrationPage } from "./components/Auction";
import AppFooter from "./components/CommonAtoms/AppFooter";
import { club } from "./theme/clubTheme";
import { notificationApi } from "./state/features/notifications/notificationSlice";
import { useGetUserProfileQuery, useUpdateThemePreferenceMutation } from "./state/features/auth/authSlice";

function App() {
    const [collapsed, setCollapsed] = useState(false);
    // Lazy-initialize from localStorage directly rather than defaulting to
    // true and flipping in an effect after mount. That two-pass mount (dark
    // commit, then light commit) let antd's cssinjs style injection leak
    // dark-theme rules through for some components (Menu, Button-default,
    // Tabs observed) that never got invalidated on the second pass — the
    // root cause of several "text invisible in light mode" reports this
    // session. Reading it synchronously means the app only ever mounts once,
    // in the correct theme.
    const [isDarkMode, setIsDarkMode] = useState(
        () => localStorage.getItem("isDarkMode") === "true"
    );

    const { login, user } = useAuthHook();
    const needsPasswordReset = useSelector(selectResetPassword);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Same-browser persistence (the localStorage write-back was previously missing entirely —
    // toggling only ever changed in-memory state, so a refresh/relogin always fell back to
    // whatever "isDarkMode" last happened to be in storage, i.e. never anything you'd set).
    useEffect(() => {
        try {
            localStorage.setItem("isDarkMode", String(isDarkMode));
        } catch {
            // ignore storage failures (private browsing, quota, etc.)
        }
    }, [isDarkMode]);

    // Cross-device persistence: the player's own themePreference on the server. Only applied
    // when the server actually has one set (null means "never explicitly chosen on any device"
    // — leave the local/OS default alone rather than forcing light on a brand-new device).
    // Safe to depend on this re-running after every toggle: the mutation below invalidates this
    // query, so it refetches and converges on the value we just saved — not a fight, a no-op.
    const { data: ownProfile } = useGetUserProfileQuery(
        { id: user?.userId ?? "" },
        { skip: !user?.token || !user?.userId }
    );
    const [updateThemePreference] = useUpdateThemePreferenceMutation();

    useEffect(() => {
        const serverPreference = ownProfile?.content?.themePreference;
        if (serverPreference === "light" || serverPreference === "dark") {
            setIsDarkMode(serverPreference === "dark");
        }
    }, [ownProfile?.content?.themePreference]);

    const handleSetIsDarkMode = (value: boolean) => {
        setIsDarkMode(value);
        // Fire-and-forget: RTK Query mutation triggers resolve (not reject) even on API
        // error, so a failed server sync just means the next device won't pick it up yet —
        // the local toggle above already applied, not worth interrupting the user over.
        if (user?.token) {
            updateThemePreference({ themePreference: value ? "dark" : "light" });
        }
    };

    // Clicking a push notification posts {type, url} from public/sw.js's
    // "notificationclick" handler to an already-open tab — route there via
    // the SPA router instead of a full page load. Also invalidate the
    // notification cache: RTK Query otherwise serves whatever was last
    // fetched for /notifications (stale by however long the tab's been
    // open) instead of the item that was just pushed — this forces a
    // refetch whether the page is already mounted or about to be.
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === "push-received") {
                dispatch(notificationApi.util.invalidateTags(["notification"]));
            } else if (event.data?.type === "notification-click" && event.data.url) {
                dispatch(notificationApi.util.invalidateTags(["notification"]));
                navigate(event.data.url);
            }
        };
        navigator.serviceWorker.addEventListener("message", onMessage);
        return () => navigator.serviceWorker.removeEventListener("message", onMessage);
    }, [navigate, dispatch]);

    const handleToggleCollapse = (value: boolean) => {
        setCollapsed(value);
    };

    useLayoutEffect(() => {
        const tokenContent = localStorage.getItem("tokenContent");
        if (tokenContent && checkTockenValidity(tokenContent)) {
            login(tokenContent);
        }
    }, []);

    // Public route: Auction Registration (no login required)
    const isPublicAuctionRoute = location.pathname.startsWith("/auction/register/");

    if (!user?.token && isPublicAuctionRoute) {
        return (
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    token: { colorPrimary: isDarkMode ? club.gold : club.navy },
                }}
            >
                <div className={isDarkMode ? "dark-mode" : "light-mode"} style={{ minHeight: "100vh" }}>
                    <Routes>
                        <Route path="auction/register/:tournamentId" element={<AuctionRegistrationPage />} />
                    </Routes>
                </div>
            </ConfigProvider>
        );
    }

    if (!user?.token) {
        return (
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode
                        ? theme.darkAlgorithm
                        : theme.defaultAlgorithm,
                }}
            >
                <div
                    className={isDarkMode ? "dark-mode" : "light-mode"}
                    style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
                >
                    <ToastContainer
                        theme={isDarkMode ? "dark" : "light"}
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={true}
                        closeOnClick={true}
                        pauseOnHover={true}
                        draggable={true}
                    />
                    {location.pathname !== "/login" && (
                        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1200 }}>
                            <Link
                                to="/login"
                                aria-label="Go to login"
                                style={{
                                    color: "var(--color-accent)",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                }}
                            >
                                Login
                            </Link>
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/tournament-viewer" element={<TournamentViewerPage hasHeader={false} />} />
                            <Route path="/tournament-viewer/:tournamentId" element={<TournamentViewerPage hasHeader={false} />} />
                            <Route path="/tournament-viewer/:tournamentId/:tab" element={<TournamentViewerPage hasHeader={false} />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </div>
                    {location.pathname !== "/login" && <AppFooter />}
                </div>
            </ConfigProvider>
        );
    }

    if (needsPasswordReset) {
        return (
            <div className={isDarkMode ? "dark-mode" : "light-mode"}>
                <ToastContainer
                    theme={isDarkMode ? "dark" : "light"}
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick={true}
                    pauseOnHover={true}
                    draggable={true}
                />
                <PasswordResetPage />
            </div>
        );
    }

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode
                    ? theme.darkAlgorithm
                    : theme.defaultAlgorithm,
                token: {
                    // BOFC crest palette — deep shield green as the primary accent
                    // (matches brand-500 in tailwind.config.js), gold/deep-green
                    // link treatment mirroring tokens.css's dark/light --color-accent split.
                    colorPrimary: '#28552B',
                    colorTextLightSolid: '#ffffff',
                    colorLink: isDarkMode ? '#B69549' : '#17461C',
                    colorLinkHover: isDarkMode ? '#C9AE71' : '#07380E',
                    colorBgContainer: isDarkMode ? '#1F2937' : '#ffffff',
                    colorText: isDarkMode ? '#F9FAFB' : '#111827',
                    colorTextSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',

                    // Semantic status colors — colorInfo intentionally stays a
                    // genuine blue (the app's own "blue-light" scale), distinct
                    // from the green brand accent, so info states don't read as
                    // just another shade of the primary color.
                    colorSuccess: isDarkMode ? '#22C55E' : '#16A34A',
                    colorError: isDarkMode ? '#EF4444' : '#DC2626',
                    colorInfo: isDarkMode ? '#0ba5ec' : '#0086c9',
                    colorWarning: isDarkMode ? '#F59E0B' : '#D97706',

                    // Layout
                    colorBgLayout: isDarkMode ? '#111827' : '#F9FAFB',

                    // Modal
                    colorBgMask: 'rgba(0, 0, 0, 0.5)',
                    colorBgElevated: isDarkMode ? '#1F2937' : '#ffffff',

                    // Border
                    colorBorder: isDarkMode ? '#374151' : '#E5E7EB',
                    colorBorderSecondary: isDarkMode ? '#1F2937' : '#F3F4F6',

                    // Fills
                    colorFillSecondary: isDarkMode ? '#374151' : '#F3F4F6',
                    colorFillTertiary: isDarkMode ? '#4B5563' : '#F9FAFB',
                    colorFillQuaternary: isDarkMode ? '#1F2937' : '#F3F4F6',

                    // Border radius — TailAdmin uses 12px
                    borderRadius: 12,
                    borderRadiusLG: 12,
                    borderRadiusSM: 8,
                    borderRadiusXS: 6,

                    // Font
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                },
                components: {
                    Typography: {
                        colorTextHeading: isDarkMode ? '#F9FAFB' : '#111827',
                        colorTextSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
                        colorText: isDarkMode ? '#F9FAFB' : '#111827',
                    },
                    Button: {
                        colorPrimary: '#28552B',
                        colorPrimaryHover: '#547A55',
                        colorPrimaryActive: '#173F1A',
                        borderRadius: 8,
                    },
                    Input: {
                        colorBgContainer: isDarkMode ? '#1F2937' : '#ffffff',
                        colorBorder: isDarkMode ? '#374151' : '#D1D5DB',
                        colorText: isDarkMode ? '#F9FAFB' : '#111827',
                        borderRadius: 8,
                    },
                    Table: {
                        colorBgContainer: isDarkMode ? '#1F2937' : '#ffffff',
                        colorText: isDarkMode ? '#F9FAFB' : '#111827',
                        colorTextHeading: isDarkMode ? '#9CA3AF' : '#6B7280',
                        headerBg: isDarkMode ? '#1F2937' : '#F9FAFB',
                        headerColor: isDarkMode ? '#9CA3AF' : '#6B7280',
                        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                        rowHoverBg: isDarkMode ? '#374151' : '#F3F4F6',
                        borderRadius: 12,
                    },
                    Card: {
                        colorBgContainer: isDarkMode ? '#1F2937' : '#ffffff',
                        borderRadiusLG: 12,
                    },
                },
            }}
        >
            <DefaultLayout isDarkMode={isDarkMode} setIsDarkMode={handleSetIsDarkMode}>
                <ToastContainer
                    theme={isDarkMode ? "dark" : "light"}
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick={true}
                    pauseOnHover={true}
                    draggable={true}
                    style={{ top: 88 }}
                />
                <ContentComponent
                    collapsed={collapsed}
                    onToggleCollapse={handleToggleCollapse}
                    setIsDarkMode={handleSetIsDarkMode}
                    isDarkMode={isDarkMode}
                />
            </DefaultLayout>
        </ConfigProvider>
    );
}

export default App;
