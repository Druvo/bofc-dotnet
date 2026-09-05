import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectLoginInfo, selectUserImage } from "../../state/slices/loginInfoSlice";
import { useAuthHook } from "../../hooks/useAuthHook";
import { useAppShell } from "./AppShellContext";
import LiveMatchIndicator from "../CommonAtoms/LiveMatchIndicator";
import Avatar from "../CommonAtoms/Avatar";
import FormSwitch from "../ui/form-switch";
import { showBdLocalTime } from "../../utils/utils";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../state/features/notifications/notificationSlice";
import { useGetMatchDaysQuery } from "../../state/features/matchDays/matchDaysSlice";
import { useGetVanuesQuery } from "../../state/features/vanues/vanuesSlice";
import { useGetPushNotificationsEnabledQuery } from "../../state/features/settings/settingsSlice";

const NOTIF_PREVIEW_LIMIT = 5;

/**
 * TailAdmin Free v2.3.0 header (src/partials/header.html), ported from
 * Alpine.js to React. Real data/behavior wired in: user info + avatar from
 * Redux (selectLoginInfo/selectUserImage, same source the old header used),
 * dark mode from App.tsx's existing isDarkMode state (unchanged source of
 * truth - just a new consumer), logout from useAuthHook (existing).
 *
 * The search box was TailAdmin's own decorative demo data (readOnly input,
 * no backend to query) - now does a real client-side search across players,
 * matchDays, and venues using the same list queries those pages already
 * fetch (RTK Query cache means this doesn't cost an extra round-trip once
 * the user's visited any of them). The notification bell is wired to the
 * real in-app log (browserNotifications.ts); its dropdown shows a recent
 * preview with a "See more" link into the full /notifications page.
 */

const SEARCH_RESULT_LIMIT = 5;

interface HeaderProps {
  sidebarToggle: boolean;
  setSidebarToggle: (value: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function Header({ sidebarToggle, setSidebarToggle, isDarkMode, setIsDarkMode }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthHook();
  const loginInfo = useSelector(selectLoginInfo);
  const userImage = useSelector(selectUserImage);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const appShell = useAppShell();

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

  const isOnStatisticsPage = location.pathname === "/player-statistics";
  const isOnDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  // Global search - client-side over already-cached lists, no dedicated
  // search endpoint needed for a dataset this small.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const { data: playersData } = useGetPlayersQuery();
  const { data: matchDaysData } = useGetMatchDaysQuery({
    offSet: 0,
    pageSize: 200,
    sortedBy: "matchDayDate",
    sortDirection: "DESC",
  });
  const { data: venuesData } = useGetVanuesQuery();

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchedPlayers = useMemo(
    () =>
      !trimmedQuery
        ? []
        : (playersData?.content ?? [])
            .filter(
              (p) =>
                p.name?.toLowerCase().includes(trimmedQuery) ||
                p.employeeId?.toLowerCase().includes(trimmedQuery)
            )
            .slice(0, SEARCH_RESULT_LIMIT),
    [playersData, trimmedQuery]
  );

  const matchedMatchDays = useMemo(
    () =>
      !trimmedQuery
        ? []
        : (matchDaysData?.content?.matchDays ?? [])
            .filter((t) => t.name?.toLowerCase().includes(trimmedQuery))
            .slice(0, SEARCH_RESULT_LIMIT),
    [matchDaysData, trimmedQuery]
  );

  const matchedVenues = useMemo(
    () =>
      !trimmedQuery
        ? []
        : (venuesData?.content ?? [])
            .filter(
              (v) =>
                v.name?.toLowerCase().includes(trimmedQuery) ||
                v.address?.toLowerCase().includes(trimmedQuery)
            )
            .slice(0, SEARCH_RESULT_LIMIT),
    [venuesData, trimmedQuery]
  );

  const hasSearchResults = matchedPlayers.length > 0 || matchedMatchDays.length > 0 || matchedVenues.length > 0;

  useEffect(() => {
    if (!searchOpen) return;
    const onOutsideClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header data-app-header-bar className="sticky top-0 z-bottomBar hidden w-full shrink-0 border-[var(--color-rule-2)] bg-[var(--color-paper-3)] md:flex lg:border-b">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4 dark:border-[var(--color-rule)]">
          <button
            className="z-sticky flex h-10 w-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:h-11 lg:w-11 lg:border dark:border-[var(--color-rule)] dark:text-gray-400"
            onClick={() => setSidebarToggle(!sidebarToggle)}
            aria-label="Toggle sidebar"
          >
            <svg className="fill-current" width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
              />
            </svg>
          </button>

          {(isOnDashboard || isOnStatisticsPage) && (
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:h-11 lg:w-11 dark:text-gray-400 dark:hover:bg-gray-800"
              onClick={() => navigate(isOnStatisticsPage ? "/dashboard" : "/player-statistics")}
              title={isOnStatisticsPage ? "Dashboard" : "Player Statistics"}
            >
              <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C11.5858 2 11.25 2.33579 11.25 2.75V12C11.25 12.4142 11.5858 12.75 12 12.75H21.25C21.6642 12.75 22 12.4142 22 12C22 6.47715 17.5228 2 12 2ZM12.75 11.25V3.53263C13.2645 3.57761 13.7659 3.66843 14.25 3.80098V3.80099C15.6929 4.19606 16.9827 4.96184 18.0104 5.98959C19.0382 7.01734 19.8039 8.30707 20.199 9.75C20.3316 10.2341 20.4224 10.7355 20.4674 11.25H12.75ZM2 12C2 7.25083 5.31065 3.27489 9.75 2.25415V3.80099C6.14748 4.78734 3.5 8.0845 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C15.9155 20.5 19.2127 17.8525 20.199 14.25H21.7459C20.7251 18.6894 16.7492 22 12 22C6.47715 22 2 17.5229 2 12Z"
                />
              </svg>
            </button>
          )}
          <LiveMatchIndicator isMobile={false} />

          <div className="hidden lg:block" ref={searchBoxRef}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                  />
                </svg>
              </span>
              <input
                type="text"
                autoComplete="off"
                placeholder="Search players, Match Days, venues..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => searchQuery && setSearchOpen(true)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 xl:w-[430px] dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] dark:text-white/90 dark:placeholder:text-white/30"
              />

              {searchOpen && trimmedQuery && (
                <div className="shadow-theme-lg absolute left-0 top-[calc(100%+8px)] z-dropdown w-full max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                  {!hasSearchResults ? (
                    <p className="px-3 py-4 text-center text-theme-sm text-gray-400 dark:text-gray-500">
                      No results for "{searchQuery}"
                    </p>
                  ) : (
                    <>
                      {matchedPlayers.length > 0 && (
                        <div className="mb-1">
                          <span className="block px-3 py-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Players</span>
                          {matchedPlayers.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                navigate(`/players/${p.id}`);
                                closeSearch();
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                              <span className="truncate font-medium text-gray-800 dark:text-white/90">{p.name}</span>
                              <span className="shrink-0 text-theme-xs text-gray-400 dark:text-gray-500">{p.employeeId}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {matchedMatchDays.length > 0 && (
                        <div className="mb-1">
                          <span className="block px-3 py-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Match Days</span>
                          {matchedMatchDays.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                navigate(`/match-day-viewer/${t.id}`);
                                closeSearch();
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                              <span className="truncate font-medium text-gray-800 dark:text-white/90">{t.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {matchedVenues.length > 0 && (
                        <div>
                          <span className="block px-3 py-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Venues</span>
                          {matchedVenues.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                navigate("/venues");
                                closeSearch();
                              }}
                              className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                              <span className="truncate font-medium text-gray-800 dark:text-white/90">{v.name}</span>
                              {v.address && <span className="truncate text-theme-xs text-gray-400 dark:text-gray-500">{v.address}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-4 px-5 py-4 lg:w-auto lg:justify-end lg:px-0 lg:shadow-none">
          <div className="flex items-center gap-2 2xsm:gap-3">
            <button
              className="hover:text-dark-900 relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.99998 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 9.99998 4.2915C9.58577 4.2915 9.24998 3.95572 9.24998 3.5415V2.2915C9.24998 1.87729 9.58577 1.5415 9.99998 1.5415ZM10.0009 6.79327C8.22978 6.79327 6.79402 8.22904 6.79402 10.0001C6.79402 11.7712 8.22978 13.207 10.0009 13.207C11.772 13.207 13.2078 11.7712 13.2078 10.0001C13.2078 8.22904 11.772 6.79327 10.0009 6.79327ZM5.29402 10.0001C5.29402 7.40061 7.40135 5.29327 10.0009 5.29327C12.6004 5.29327 14.7078 7.40061 14.7078 10.0001C14.7078 12.5997 12.6004 14.707 10.0009 14.707C7.40135 14.707 5.29402 12.5997 5.29402 10.0001ZM15.9813 5.08035C16.2742 4.78746 16.2742 4.31258 15.9813 4.01969C15.6884 3.7268 15.2135 3.7268 14.9207 4.01969L14.0368 4.90357C13.7439 5.19647 13.7439 5.67134 14.0368 5.96423C14.3297 6.25713 14.8045 6.25713 15.0974 5.96423L15.9813 5.08035ZM18.4577 10.0001C18.4577 10.4143 18.1219 10.7501 17.7077 10.7501H16.4577C16.0435 10.7501 15.7077 10.4143 15.7077 10.0001C15.7077 9.58592 16.0435 9.25013 16.4577 9.25013H17.7077C18.1219 9.25013 18.4577 9.58592 18.4577 10.0001ZM14.9207 15.9806C15.2135 16.2735 15.6884 16.2735 15.9813 15.9806C16.2742 15.6877 16.2742 15.2128 15.9813 14.9199L15.0974 14.036C14.8045 13.7431 14.3297 13.7431 14.0368 14.036C13.7439 14.3289 13.7439 14.8038 14.0368 15.0967L14.9207 15.9806ZM9.99998 15.7088C10.4142 15.7088 10.75 16.0445 10.75 16.4588V17.7088C10.75 18.123 10.4142 18.4588 9.99998 18.4588C9.58577 18.4588 9.24998 18.123 9.24998 17.7088V16.4588C9.24998 16.0445 9.58577 15.7088 9.99998 15.7088ZM5.96356 15.0972C6.25646 14.8043 6.25646 14.3295 5.96356 14.0366C5.67067 13.7437 5.1958 13.7437 4.9029 14.0366L4.01902 14.9204C3.72613 15.2133 3.72613 15.6882 4.01902 15.9811C4.31191 16.274 4.78679 16.274 5.07968 15.9811L5.96356 15.0972ZM4.29224 10.0001C4.29224 10.4143 3.95645 10.7501 3.54224 10.7501H2.29224C1.87802 10.7501 1.54224 10.4143 1.54224 10.0001C1.54224 9.58592 1.87802 9.25013 2.29224 9.25013H3.54224C3.95645 9.25013 4.29224 9.58592 4.29224 10.0001ZM4.9029 5.9637C5.1958 6.25659 5.67067 6.25659 5.96356 5.9637C6.25646 5.6708 6.25646 5.19593 5.96356 4.90303L5.07968 4.01915C4.78679 3.72626 4.31191 3.72626 4.01902 4.01915C3.72613 4.31204 3.72613 4.78692 4.01902 5.07981L4.9029 5.9637Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17.4547 11.97L18.1799 12.1611C18.265 11.8383 18.1265 11.4982 17.8401 11.3266C17.5538 11.1551 17.1885 11.1934 16.944 11.4207L17.4547 11.97ZM8.0306 2.5459L8.57989 3.05657C8.80718 2.81209 8.84554 2.44682 8.67398 2.16046C8.50243 1.8741 8.16227 1.73559 7.83948 1.82066L8.0306 2.5459ZM12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524H5.49707C5.49707 11.1823 8.81835 14.5035 12.9154 14.5035V13.0035ZM16.944 11.4207C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035V14.5035C14.8657 14.5035 16.6418 13.7499 17.9654 12.5193L16.944 11.4207ZM16.7295 11.7789C15.9437 14.7607 13.2277 16.9586 10.0003 16.9586V18.4586C13.9257 18.4586 17.2249 15.7853 18.1799 12.1611L16.7295 11.7789ZM10.0003 16.9586C6.15734 16.9586 3.04199 13.8433 3.04199 10.0003H1.54199C1.54199 14.6717 5.32892 18.4586 10.0003 18.4586V16.9586ZM3.04199 10.0003C3.04199 6.77289 5.23988 4.05695 8.22173 3.27114L7.83948 1.82066C4.21532 2.77574 1.54199 6.07486 1.54199 10.0003H3.04199ZM6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657L7.48132 2.03522C6.25073 3.35885 5.49707 5.13487 5.49707 7.08524H6.99707Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>

            <div className="relative">
              <button
                className="hover:text-dark-900 relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                onClick={() => setNotifDropdownOpen((v) => !v)}
                aria-label="Notifications"
              >
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                  />
                </svg>
                {unreadNotifCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-dropdown" onClick={() => setNotifDropdownOpen(false)} />
                  <div className="shadow-theme-lg absolute right-0 z-dropdown mt-[17px] flex w-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                    <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-[var(--color-rule)]">
                      <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">Notifications</h5>
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
                      <p className="px-1 py-4 text-center text-theme-sm text-gray-500 dark:text-gray-400">
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
                        setNotifDropdownOpen(false);
                        navigate("/notifications");
                      }}
                      className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-center text-theme-sm font-medium text-brand-500 hover:bg-gray-50 dark:border-[var(--color-rule)] dark:text-brand-400 dark:hover:bg-white/5"
                    >
                      See more
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              className="flex items-center text-gray-700 dark:text-gray-400"
              onClick={() => setUserDropdownOpen((v) => !v)}
            >
              <Avatar
                src={userImage || undefined}
                name={loginInfo?.username}
                seed={loginInfo?.userId}
                size={44}
                className="mr-3 bg-gray-100 dark:bg-[var(--color-paper-2)]"
              />
              <span className="mr-1 whitespace-nowrap text-theme-sm font-medium">{loginInfo?.username || "User"}</span>
              <svg
                className={`stroke-gray-500 dark:stroke-gray-400 ${userDropdownOpen ? "rotate-180" : ""}`}
                width="18"
                height="20"
                viewBox="0 0 18 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 z-dropdown" onClick={() => setUserDropdownOpen(false)} />
                <div className="shadow-theme-lg absolute right-0 z-dropdown mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                  <div>
                    <span className="block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                      {loginInfo?.username || "User"}
                    </span>
                    <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                      {loginInfo?.email || ""}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1 border-b border-gray-200 pb-3 pt-4 dark:border-[var(--color-rule)]">
                    <li>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        Edit profile
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          appShell.openGoalkeepingHistory();
                        }}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        My Goalkeeping History
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
                            setUserDropdownOpen(false);
                            appShell.promptInstall();
                          }}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                          Install App
                        </button>
                      </li>
                    )}
                  </ul>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="group mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
