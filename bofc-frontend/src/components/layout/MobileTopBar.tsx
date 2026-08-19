import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BellOutlined,
  BulbOutlined,
  BulbFilled,
  LogoutOutlined,
  EditOutlined,
  TrophyOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { selectLoginInfo, selectUserImage } from "../../state/slices/loginInfoSlice";
import { useAuthHook } from "../../hooks/useAuthHook";
import { useAppShell } from "./AppShellContext";
import Avatar from "../CommonAtoms/Avatar";
import FormSwitch from "../ui/form-switch";
import { showBdLocalTime } from "../../utils/utils";
import companyLogo from "../../assets/logo.png";
import {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../state/features/notifications/notificationSlice";
import { useGetPushNotificationsEnabledQuery } from "../../state/features/settings/settingsSlice";

const NOTIF_PREVIEW_LIMIT = 5;

interface MobileTopBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

/**
 * Mobile-only (<768px) top bar - pairs with MobileTabBar (bottom nav) for
 * app-like chrome. Desktop Header (md:flex hidden below md) owns the same
 * actions there; this is a condensed mobile equivalent, not a duplicate of
 * every Header feature (search/live-match-indicator/stats-toggle stay
 * desktop-only - reachable via the bottom tab bar's own destinations there).
 */
export default function MobileTopBar({ isDarkMode, setIsDarkMode }: MobileTopBarProps) {
  const navigate = useNavigate();
  const { logout } = useAuthHook();
  const loginInfo = useSelector(selectLoginInfo);
  const userImage = useSelector(selectUserImage);
  const appShell = useAppShell();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const { data: notifData } = useGetMyNotificationsQuery(
    { offSet: 0, pageSize: NOTIF_PREVIEW_LIMIT },
    { pollingInterval: 30000 }
  );
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();
  const { data: pushEnabledData } = useGetPushNotificationsEnabledQuery();
  const pushNotificationsEnabled = pushEnabledData?.content ?? true;
  const notifEntries = notifData?.content?.notifications ?? [];
  const unreadNotifCount = notifData?.content?.unreadCount ?? 0;

  const iconButtonClass =
    "relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5";

  return (
    <header className="sticky top-0 z-sticky flex h-14 items-center justify-between gap-2 border-b border-[var(--color-rule-2)] bg-[var(--color-paper-3)] px-3 md:hidden">
      <div className="flex min-w-0 items-center gap-1.5">
        <button onClick={() => navigate("/")} className="flex shrink-0 items-center gap-1.5 pr-1">
          <img src={companyLogo} alt="BOFC" className="h-8 w-8 shrink-0" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">BOFC</span>
        </button>

        <button
          className={iconButtonClass}
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <BulbFilled /> : <BulbOutlined />}
        </button>

        <div className="relative">
          <button
            className={iconButtonClass}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
          >
            <BellOutlined />
            {unreadNotifCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-dropdown" onClick={() => setNotifOpen(false)} />
              {/* Fixed + inset from both edges (not an absolute w-[290px] dropdown
                  anchored to the bell's own x-position) - the bell sits far enough
                  left on a 375px screen that a fixed-width dropdown ran off the
                  right edge of the viewport. */}
              <div className="shadow-theme-lg fixed left-3 right-3 top-[60px] z-dropdown flex max-h-[75vh] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-[var(--color-rule)]">
                  <h5 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Notifications</h5>
                  {unreadNotifCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-theme-xs font-medium text-brand-500 hover:underline dark:text-brand-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifEntries.length === 0 ? (
                  <p className="px-1 py-4 text-center text-theme-xs text-gray-500 dark:text-gray-400">
                    Nothing yet - notifications sent to you will show up here.
                  </p>
                ) : (
                  <div className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto">
                    {notifEntries.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          if (!e.isRead) markNotificationRead(e.id);
                        }}
                        className={`cursor-pointer rounded-lg border px-2.5 py-2 ${
                          e.isRead
                            ? "border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
                            : "border-brand-500/30 bg-brand-50 dark:bg-brand-500/10"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {!e.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                          <span className="text-theme-xs font-semibold text-gray-800 dark:text-white/90">{e.title}</span>
                        </div>
                        {e.body && <div className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{e.body}</div>}
                        <div className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{showBdLocalTime(e.sentDate)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate("/notifications");
                  }}
                  className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-center text-theme-xs font-medium text-brand-500 hover:bg-gray-50 dark:border-[var(--color-rule)] dark:text-brand-400 dark:hover:bg-white/5"
                >
                  See more
                </button>
              </div>
            </>
          )}
        </div>

        <button className={iconButtonClass} onClick={logout} aria-label="Sign out">
          <LogoutOutlined />
        </button>
      </div>

      <div className="relative shrink-0">
        <button onClick={() => setUserOpen((v) => !v)} aria-label="Account">
          <Avatar
            src={userImage || undefined}
            name={loginInfo?.username}
            seed={loginInfo?.userId}
            size={34}
            className="bg-gray-100 dark:bg-[var(--color-paper-2)]"
          />
        </button>

        {userOpen && (
          <>
            <div className="fixed inset-0 z-dropdown" onClick={() => setUserOpen(false)} />
            <div className="shadow-theme-lg absolute right-0 z-dropdown mt-2 flex w-[250px] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
              <div>
                <span className="block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                  {loginInfo?.username || "User"}
                </span>
                <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                  {loginInfo?.email || ""}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-1">
                <li>
                  <button
                    onClick={() => {
                      setUserOpen(false);
                      navigate("/profile");
                    }}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  >
                    <EditOutlined /> Edit profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setUserOpen(false);
                      appShell.openGoalkeepingHistory();
                    }}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  >
                    <TrophyOutlined /> My Goalkeeping History
                  </button>
                </li>
                {appShell.notificationsSupported && pushNotificationsEnabled && (
                  <li>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                      <FormSwitch
                        label="Notifications"
                        checked={appShell.notificationsOn}
                        onChange={(checked) => appShell.toggleNotifications(checked)}
                      />
                    </div>
                  </li>
                )}
                {appShell.canInstall && (
                  <li>
                    <button
                      onClick={() => {
                        setUserOpen(false);
                        appShell.promptInstall();
                      }}
                      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                      <DownloadOutlined /> Install App
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
