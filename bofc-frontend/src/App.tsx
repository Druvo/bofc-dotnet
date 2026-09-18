import { ConfigProvider, theme } from "antd";
import { useEffect, useLayoutEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./styles/toastStyles.css";
import ContentComponent from "./components/Content/ContentComponent";
import DefaultLayout from "./components/layout/DefaultLayout";
import MatchDayViewerPage from "./components/MatchDayViewer/MatchDayViewerPage";
import { useAuthHook } from "./hooks/useAuthHook";
import { checkTockenValidity } from "./utils/utils";
import { useSessionExpiryWatch } from "./hooks/useSessionExpiryWatch";
import LoginPage from "./components/authPages/LoginPage";
import PasswordResetPage from "./components/authPages/PasswordResetPage";
import ForgotPasswordPage from "./components/authPages/ForgotPasswordPage";
import ResetPasswordConfirmPage from "./components/authPages/ResetPasswordConfirmPage";
import { useDispatch, useSelector } from "react-redux";
import { selectResetPassword } from "./state/slices/loginInfoSlice";
import AppFooter from "./components/CommonAtoms/AppFooter";
import { notificationApi } from "./state/features/notifications/notificationSlice";
import { useGetUserProfileQuery, useUpdateThemePreferenceMutation } from "./state/features/auth/authSlice";

function App() {
    // Lazy-initialize from localStorage directly rather than defaulting to
    // true and flipping in an effect after mount. That two-pass mount (dark
    // commit, then light commit) let antd's cssinjs style injection leak
    // dark-theme rules through for some components (Menu, Button-default,
    // Tabs observed) that never got invalidated on the second pass - the
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

    // Same-browser persistence (the localStorage write-back was previously missing entirely -
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
    // - leave the local/OS default alone rather than forcing light on a brand-new device).
    // Safe to depend on this re-running after every toggle: the mutation below invalidates this
    // query, so it refetches and converges on the value we just saved - not a fight, a no-op.
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
        // error, so a failed server sync just means the next device won't pick it up yet -
        // the local toggle above already applied, not worth interrupting the user over.
        if (user?.token) {
            updateThemePreference({ themePreference: value ? "dark" : "light" });
        }
    };

    // Clicking a push notification posts {type, url} from public/sw.js's
    // "notificationclick" handler to an already-open tab - route there via
    // the SPA router instead of a full page load. Also invalidate the
    // notification cache: RTK Query otherwise serves whatever was last
    // fetched for /notifications (stale by however long the tab's been
    // open) instead of the item that was just pushed - this forces a
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

    useLayoutEffect(() => {
        const tokenContent = localStorage.getItem("tokenContent");
        if (tokenContent && checkTockenValidity(tokenContent)) {
            login(tokenContent);
        }
    }, []);

    // The check above runs once, on mount. This keeps checking, so a tab open across the token's
    // seven-day expiry is signed out and told why, rather than sitting there looking logged in
    // while every request it makes comes back 401.
    useSessionExpiryWatch();

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
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
                            <Route path="/match-day-viewer" element={<MatchDayViewerPage hasHeader={false} />} />
                            <Route path="/match-day-viewer/:matchDayId" element={<MatchDayViewerPage hasHeader={false} />} />
                            <Route path="/match-day-viewer/:matchDayId/:tab" element={<MatchDayViewerPage hasHeader={false} />} />
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
                    // Exact hex from design_handoff_club_app_fixes's THEMES object
                    // (source of truth), not hand-picked approximations.
                    colorPrimary: '#2F6B45',
                    colorTextLightSolid: '#ffffff',
                    colorLink: isDarkMode ? '#7fd99a' : '#2f6b45',
                    colorLinkHover: isDarkMode ? '#a3e6b8' : '#23532f',
                    colorBgContainer: isDarkMode ? '#12241A' : '#ffffff',
                    colorText: isDarkMode ? '#F2F5F0' : '#16241A',
                    colorTextSecondary: isDarkMode ? '#9FB3A5' : '#6B7D70',

                    // Semantic status colors - colorInfo intentionally stays a
                    // genuine blue (the app's own "blue-light" scale), distinct
                    // from the green brand accent, so info states don't read as
                    // just another shade of the primary color.
                    colorSuccess: '#2F8A52',
                    colorError: '#C04A3A',
                    colorInfo: isDarkMode ? '#0ba5ec' : '#0086c9',
                    colorWarning: '#D69A2F',

                    // Layout
                    colorBgLayout: isDarkMode ? '#0A0F0C' : '#F7F8F6',

                    // Modal
                    colorBgMask: 'rgba(0, 0, 0, 0.5)',
                    colorBgElevated: isDarkMode ? '#12241A' : '#ffffff',

                    // Border
                    colorBorder: isDarkMode ? '#2A3D31' : '#E7EBE4',
                    colorBorderSecondary: isDarkMode ? '#1C2B21' : '#ECEEE9',

                    // Fills
                    colorFillSecondary: isDarkMode ? '#0E1C14' : '#F4F6F2',
                    colorFillTertiary: isDarkMode ? '#16281C' : '#EAF3EC',
                    colorFillQuaternary: isDarkMode ? '#0E1C14' : '#F4F6F2',

                    // Border radius - TailAdmin uses 12px
                    borderRadius: 12,
                    borderRadiusLG: 12,
                    borderRadiusSM: 8,
                    borderRadiusXS: 6,

                    // Font
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                },
                components: {
                    Typography: {
                        colorTextHeading: isDarkMode ? '#F2F5F0' : '#16241A',
                        colorTextSecondary: isDarkMode ? '#9FB3A5' : '#6B7D70',
                        colorText: isDarkMode ? '#F2F5F0' : '#16241A',
                    },
                    Button: {
                        colorPrimary: '#2F6B45',
                        colorPrimaryHover: '#3D8759',
                        colorPrimaryActive: '#245536',
                        borderRadius: 8,
                    },
                    Input: {
                        colorBgContainer: isDarkMode ? '#12241A' : '#ffffff',
                        colorBorder: isDarkMode ? '#2A3D31' : '#D1D5DB',
                        colorText: isDarkMode ? '#F2F5F0' : '#16241A',
                        borderRadius: 8,
                    },
                    Table: {
                        colorBgContainer: isDarkMode ? '#12241A' : '#ffffff',
                        colorText: isDarkMode ? '#F2F5F0' : '#16241A',
                        colorTextHeading: isDarkMode ? '#9FB3A5' : '#6B7D70',
                        headerBg: isDarkMode ? '#0E1C14' : '#F7F8F6',
                        headerColor: isDarkMode ? '#9FB3A5' : '#6B7D70',
                        borderColor: isDarkMode ? '#2A3D31' : '#E7EBE4',
                        rowHoverBg: isDarkMode ? '#16281C' : '#F4F6F2',
                        borderRadius: 12,
                    },
                    Card: {
                        colorBgContainer: isDarkMode ? '#12241A' : '#ffffff',
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
                    setIsDarkMode={handleSetIsDarkMode}
                    isDarkMode={isDarkMode}
                />
            </DefaultLayout>
        </ConfigProvider>
    );
}

export default App;
