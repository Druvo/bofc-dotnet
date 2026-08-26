import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { CalendarOutlined, SettingOutlined, BellOutlined, BulbOutlined, BulbFilled, LogoutOutlined } from "@ant-design/icons";
import { selectLoginInfo, selectUserImage, selectUserRoles } from "../../state/slices/loginInfoSlice";
import useAuctionEnabled from "../../hooks/useAuctionEnabled";
import { useAuthHook } from "../../hooks/useAuthHook";
import { useGetMyNotificationsQuery } from "../../state/features/notifications/notificationSlice";
import Avatar from "../CommonAtoms/Avatar";
import companyLogo from "../../assets/logo.png";

/**
 * TailAdmin Free v2.3.0 sidebar (src/partials/sidebar.html), ported from
 * Alpine.js to React. Menu content is BOFC's own IA, not TailAdmin's demo
 * pages - only the visual
 * shell/interaction pattern is TailAdmin's. Icons are TailAdmin's own inline
 * SVGs, reassigned to the closest-fitting BOFC concept.
 *
 * Alpine's single shared `selected` (persisted to localStorage, only one
 * dropdown group open at a time) becomes useState + a small localStorage
 * read/write here. Alpine's `page === '...'` string comparisons become
 * useLocation() path matching - the natural React equivalent.
 */

const SELECTED_GROUP_STORAGE_KEY = "tailadmin.sidebar.selectedGroup";

interface NavLeaf {
  label: string;
  path: string;
  adminOnly?: boolean;
}

interface NavSubGroup {
  label: string;
  children: NavLeaf[];
  adminOnly?: boolean;
}

type NavChild = NavLeaf | NavSubGroup;

const isSubGroup = (child: NavChild): child is NavSubGroup => "children" in child;

interface NavGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  matchPrefixes: string[];
  children: NavChild[];
  adminOnly?: boolean;
}

const iconSvgProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "currentColor" as const, xmlns: "http://www.w3.org/2000/svg" };

export const DashboardIcon = (
  <svg {...iconSvgProps}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z"
    />
  </svg>
);
export const ProfileIcon = (
  <svg {...iconSvgProps}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
    />
  </svg>
);
const FormsIcon = (
  <svg {...iconSvgProps}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H18.5001C19.7427 20.75 20.7501 19.7426 20.7501 18.5V5.5C20.7501 4.25736 19.7427 3.25 18.5001 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H18.5001C18.9143 4.75 19.2501 5.08579 19.2501 5.5V18.5C19.2501 18.9142 18.9143 19.25 18.5001 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V5.5ZM6.25005 9.7143C6.25005 9.30008 6.58583 8.9643 7.00005 8.9643L17 8.96429C17.4143 8.96429 17.75 9.30008 17.75 9.71429C17.75 10.1285 17.4143 10.4643 17 10.4643L7.00005 10.4643C6.58583 10.4643 6.25005 10.1285 6.25005 9.7143ZM6.25005 14.2857C6.25005 13.8715 6.58583 13.5357 7.00005 13.5357H17C17.4143 13.5357 17.75 13.8715 17.75 14.2857C17.75 14.6999 17.4143 15.0357 17 15.0357H7.00005C6.58583 15.0357 6.25005 14.6999 6.25005 14.2857Z"
    />
  </svg>
);
const TablesIcon = (
  <svg {...iconSvgProps}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.25 5.5C3.25 4.25736 4.25736 3.25 5.5 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V18.5C20.75 19.7426 19.7426 20.75 18.5 20.75H5.5C4.25736 20.75 3.25 19.7426 3.25 18.5V5.5ZM5.5 4.75C5.08579 4.75 4.75 5.08579 4.75 5.5V8.58325L19.25 8.58325V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H5.5ZM19.25 10.0833H15.416V13.9165H19.25V10.0833ZM13.916 10.0833L10.083 10.0833V13.9165L13.916 13.9165V10.0833ZM8.58301 10.0833H4.75V13.9165H8.58301V10.0833ZM4.75 18.5V15.4165H8.58301V19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5ZM10.083 19.25V15.4165L13.916 15.4165V19.25H10.083ZM15.416 19.25V15.4165H19.25V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15.416Z"
    />
  </svg>
);
/** Sourced straight from the icon pack (@ant-design/icons) instead of a hand-drawn
 * glyph - matches the AntD icons used everywhere else in the app (page headers,
 * content pages). Was previously a hand-built calendar shape. */
export const NextMatchIcon = <CalendarOutlined style={{ fontSize: 20 }} />;
/** The icon pack has no literal "football pitch" glyph, so this stays hand-built
 * (rounded pitch boundary + halfway line + center circle) - every other sidebar
 * icon now comes straight from @ant-design/icons. Was previously a whistle. */
export const FieldIcon = (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <circle cx="12" cy="12" r="2.75" />
  </svg>
);
/** Sourced from the icon pack (@ant-design/icons) - was previously a hand-built gear. */
const SettingsIcon = <SettingOutlined style={{ fontSize: 20 }} />;
/** Reuses the "forms" glyph for Club Rules only now - document/lines already fits. */
const ArrowDownIcon = (
  <path d="M4.79175 7.39584L10.0001 12.6042L15.2084 7.39585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
);

interface SidebarProps {
  sidebarToggle: boolean;
  setSidebarToggle: (value: boolean) => void;
  sidebarExpanded: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function Sidebar({ sidebarToggle, setSidebarToggle, sidebarExpanded, isDarkMode, setIsDarkMode }: SidebarProps) {
  const location = useLocation();

  // Closing after every nav pick is a no-op on desktop (lg:translate-x-0 keeps the rail
  // visible regardless of sidebarToggle there) but is the only way the mobile/tablet
  // drawer ever dismisses itself after picking a destination - without it, tapping a
  // link just navigates behind the still-open drawer.
  //
  // Used on every real navigable item (rendered as <Link>, not <button onClick>) so
  // ctrl/cmd/middle-click "open in new tab" works like a normal anchor tag - a plain
  // onClick+navigate() button can never do that, only a real <a href> can. Link already
  // navigates on its own; this only handles the side effect of closing the mobile drawer.
  const closeDrawer = () => setSidebarToggle(false);

  const roles = useSelector(selectUserRoles);
  const isUserAdmin = roles.includes("ADMIN") || roles.includes("SUPERADMIN");
  const auctionEnabled = useAuctionEnabled();
  const loginInfo = useSelector(selectLoginInfo);
  const userImage = useSelector(selectUserImage);
  const { logout } = useAuthHook();
  const { data: notifData } = useGetMyNotificationsQuery({ offSet: 0, pageSize: 1 });
  const unreadNotifCount = notifData?.content?.unreadCount ?? 0;

  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    try {
      return localStorage.getItem(SELECTED_GROUP_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const groups: NavGroup[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: DashboardIcon,
      matchPrefixes: ["/dashboard", "/"],
      children: [{ label: "Overview", path: "/dashboard" }],
    },
    {
      key: "match-day",
      label: "Next Match Day",
      icon: NextMatchIcon,
      matchPrefixes: ["/match-day", "/match-day-viewer"],
      children: [{ label: "Next Match Day", path: "/match-day" }],
    },
    {
      key: "matchDays",
      label: "Match Management",
      icon: FieldIcon,
      matchPrefixes: ["/match-days", "/venues", "/auction"],
      children: [
        { label: "Match Days", path: "/match-days" },
        { label: "Venues", path: "/venues" },
        ...(auctionEnabled ? [{ label: "Auction", path: "/auction", adminOnly: true }] : []),
      ],
    },
    {
      key: "player",
      label: "Player",
      icon: ProfileIcon,
      matchPrefixes: ["/players", "/profile", "/player-statistics"],
      children: [
        { label: "Player List", path: "/players" },
        { label: "Rank Players", path: "/players/ranks", adminOnly: true },
        { label: "My Player Profile", path: "/profile" },
        { label: "Player Statistics", path: "/player-statistics" },
        { label: "Player Monthly Payments", path: "/players/monthly-payments", adminOnly: true },
      ],
    },
    {
      key: "finance",
      label: "Finance",
      icon: TablesIcon,
      matchPrefixes: ["/ac"],
      adminOnly: true,
      children: [
        {
          label: "Configuration",
          children: [
            { label: "Voucher Types", path: "/ac/voucher-types" },
            { label: "AC Natures", path: "/ac/natures" },
            { label: "Chart of Account", path: "/ac/charts" },
          ],
        },
        { label: "Collections (+)", path: "/ac/collections" },
        { label: "Bill Payment (-)", path: "/ac/bill-payments" },
        {
          label: "Voucher",
          children: [{ label: "Voucher Register", path: "/ac/vouchers" }],
        },
        {
          label: "Accounts Reports",
          children: [
            { label: "Accounts Report", path: "/ac/reports/accounts-summary" },
            { label: "Balances Summary", path: "/ac/reports/balance-summary" },
            { label: "Balances Sheet", path: "/ac/reports/balance-sheet" },
          ],
        },
      ],
    },
    {
      key: "club-rules",
      label: "Club Rules",
      icon: FormsIcon,
      matchPrefixes: ["/club-rules"],
      children: [{ label: "Club Rules", path: "/club-rules" }],
    },
    {
      key: "settings",
      label: "Settings",
      icon: SettingsIcon,
      matchPrefixes: ["/settings"],
      adminOnly: true,
      children: [{ label: "Settings", path: "/settings" }],
    },
  ];

  const visibleGroups = groups
    .filter((g) => !g.adminOnly || isUserAdmin)
    .map((g) => ({
      ...g,
      children: g.children
        .map((c) => (isSubGroup(c) ? { ...c, children: c.children.filter((leaf) => !leaf.adminOnly || isUserAdmin) } : c))
        .filter((c) => (!c.adminOnly || isUserAdmin) && (!isSubGroup(c) || c.children.length > 0)),
    }))
    .filter((g) => g.children.length > 0);

  // Plain startsWith would make e.g. "/match-days" (Match Management) match the
  // "/match-day" prefix (Next Match Day) too, since "/match-days" literally starts with
  // "/match-day" - highlighting both groups at once. Require an exact match or a "/"
  // boundary right after the prefix so sibling routes with a shared stem don't collide.
  const pathMatchesPrefix = (pathname: string, prefix: string) => {
    // "/" is the root Dashboard route, not a namespace every path lives under -
    // require an exact match there instead of the usual "/" boundary rule (which
    // would make it match every route, since every path starts with "/").
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
  };

  const isGroupActive = (group: NavGroup) =>
    group.matchPrefixes.some((prefix) => pathMatchesPrefix(location.pathname, prefix));

  useEffect(() => {
    const active = visibleGroups.find(isGroupActive);
    if (active && active.key !== selectedGroup) {
      setSelectedGroup(active.key);
    }
    // Only re-run when the route changes - opening/closing a group manually
    // shouldn't be fought by this sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (key: string) => {
    const next = selectedGroup === key ? "" : key;
    setSelectedGroup(next);
    try {
      localStorage.setItem(SELECTED_GROUP_STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  };

  // Sub-groups (e.g. Finance's "Configuration"/"Voucher"/"Accounts Reports") default
  // open and toggle independently of each other and of the top-level group state.
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Record<string, boolean>>({});
  const toggleSubGroup = (subGroupKey: string) => {
    setCollapsedSubGroups((prev) => ({ ...prev, [subGroupKey]: !prev[subGroupKey] }));
  };

  // On desktop, collapsing shrinks the rail to icons-only and hides dropdown
  // sub-menus (no room to show them) - clicking a multi-child group icon
  // navigates to its first child instead of opening the dropdown. Mobile
  // ignores this entirely: it's always full-width, shown/hidden via translate.
  const collapsed = !sidebarExpanded;

  return (
    <aside
      className={`sidebar fixed left-0 top-0 z-sticky flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-[var(--color-rule-2)] bg-[var(--color-paper-3)] px-5 lg:static lg:translate-x-0 lg:px-3 ${
        sidebarToggle ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "lg:!w-[90px]" : "lg:!w-[290px]"}`}
      style={{ transition: "width 0.2s ease-in-out" }}
    >
      <div className={`flex items-center gap-2 pb-4 pt-5 justify-end md:justify-between ${collapsed ? "lg:justify-center" : ""}`}>
        {/* Hidden below md - MobileTopBar (DefaultLayout.tsx) already shows the logo
            there, so this drawer doesn't need to repeat it. */}
        <Link to="/" onClick={closeDrawer} className="hidden items-center md:flex">
          <img src={companyLogo} alt="BOFC" className="h-12 w-12 shrink-0" />
          <span className={`ml-2 text-3xl font-semibold text-gray-800 dark:text-white ${collapsed ? "lg:hidden" : ""}`}>BOFC</span>
        </Link>
        {/* Closes the drawer on mobile/tablet (<lg) - Header (the desktop-only home for
            this) is hidden below md, so this is the only in-drawer way to dismiss it
            besides tapping the scrim outside. */}
        <button
          onClick={() => setSidebarToggle(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 lg:hidden dark:border-[var(--color-rule)] dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Close menu"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Tablet-only (md-lg) account strip - Header (the usual home for dark
          mode/notifications/sign out) is hidden below md and shows again from md up,
          so this only fills the md-lg gap. Hidden below md since MobileTopBar
          (DefaultLayout.tsx) now shows these same avatar/bell/theme/logout controls
          there - without the "hidden" this duplicated them every time the drawer
          opened on mobile. */}
      <div className="mb-4 hidden items-center justify-between border-b border-[var(--color-rule)] pb-4 md:flex lg:hidden">
        <Link to="/profile" onClick={closeDrawer} className="flex min-w-0 items-center gap-2">
          <Avatar src={userImage || undefined} name={loginInfo?.username} seed={loginInfo?.userId} size={36} />
          <span className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{loginInfo?.username || "User"}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/notifications"
            onClick={closeDrawer}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 dark:border-[var(--color-rule)] dark:text-gray-400"
            aria-label="Notifications"
          >
            <BellOutlined />
            {unreadNotifCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                {unreadNotifCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 dark:border-[var(--color-rule)] dark:text-gray-400"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <BulbFilled /> : <BulbOutlined />}
          </button>
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 dark:border-[var(--color-rule)] dark:text-gray-400"
            aria-label="Sign out"
          >
            <LogoutOutlined />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav>
          <div>
            <h3 className={`mb-4 text-xs uppercase leading-[20px] text-gray-400 ${collapsed ? "lg:text-center" : ""}`}>
              {collapsed ? <span className="lg:hidden">MENU</span> : "MENU"}
              {collapsed && <span className="hidden lg:inline">•••</span>}
            </h3>
            <ul className="mb-6 flex flex-col gap-4">
              {visibleGroups.map((group) => {
                const active = isGroupActive(group);
                const open = selectedGroup === group.key && !collapsed;
                const onlyChild = group.children.length === 1 ? group.children[0] : null;
                const hasSingleChild = onlyChild !== null && !isSubGroup(onlyChild);
                // Same target resolution go() used to do inline - now precomputed so the
                // control can render as a real <Link> (ctrl/cmd/middle-click "open in new
                // tab" only works on a real <a href>, never on a button+onClick handler)
                // whenever this click would navigate rather than just toggle the dropdown.
                const collapsedFirstLeaf = collapsed && !hasSingleChild
                  ? group.children.find((c): c is NavLeaf => !isSubGroup(c)) ?? (isSubGroup(group.children[0]) ? group.children[0].children[0] : undefined)
                  : undefined;
                const directPath = hasSingleChild ? (onlyChild as NavLeaf).path : collapsedFirstLeaf?.path;

                const groupIconAndLabel = (
                  <>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center ${active ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
                    >
                      {group.icon}
                    </span>
                    <span className={`menu-item-text ${collapsed ? "lg:hidden" : ""}`}>{group.label}</span>
                    {!hasSingleChild && (
                      <svg
                        className={`menu-item-arrow ${collapsed ? "lg:hidden" : ""} ${open ? "menu-item-arrow-active" : "menu-item-arrow-inactive"}`}
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {ArrowDownIcon}
                      </svg>
                    )}
                  </>
                );
                const groupControlClassName = `menu-item group w-full ${collapsed ? "lg:justify-center" : ""} ${active ? "menu-item-active" : "menu-item-inactive"}`;

                return (
                  <li key={group.key}>
                    {directPath ? (
                      <Link to={directPath} onClick={closeDrawer} title={collapsed ? group.label : undefined} className={groupControlClassName}>
                        {groupIconAndLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        title={collapsed ? group.label : undefined}
                        onClick={() => toggleGroup(group.key)}
                        className={groupControlClassName}
                      >
                        {groupIconAndLabel}
                      </button>
                    )}

                    {!hasSingleChild && (
                      <div className={`overflow-hidden ${collapsed ? "lg:hidden" : ""} ${open ? "block" : "hidden"}`}>
                        <ul className="menu-dropdown mt-2 flex flex-col gap-1 pl-9">
                          {group.children.map((child) => {
                            if (!isSubGroup(child)) {
                              return (
                                <li key={child.path}>
                                  <Link
                                    to={child.path}
                                    onClick={closeDrawer}
                                    className={`menu-dropdown-item group w-full text-left ${
                                      // Exact match, not pathMatchesPrefix's "starts with" - these are
                                      // sibling leaf pages (e.g. "/players" vs "/players/ranks"), not
                                      // nested namespaces, so the prefix check was lighting up both at
                                      // once whenever one leaf's path happened to prefix another's.
                                      location.pathname === child.path
                                        ? "menu-dropdown-item-active"
                                        : "menu-dropdown-item-inactive"
                                    }`}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              );
                            }

                            const subGroupKey = `${group.key}:${child.label}`;
                            const subGroupOpen = !collapsedSubGroups[subGroupKey];

                            return (
                              <li key={subGroupKey}>
                                <button
                                  type="button"
                                  onClick={() => toggleSubGroup(subGroupKey)}
                                  className="menu-dropdown-item group flex w-full items-center justify-between text-left menu-dropdown-item-inactive"
                                >
                                  {child.label}
                                  <svg
                                    className={`h-4 w-4 shrink-0 transition-transform ${subGroupOpen ? "rotate-180" : ""}`}
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    {ArrowDownIcon}
                                  </svg>
                                </button>
                                {subGroupOpen && (
                                  <ul className="mt-1 flex flex-col gap-1 pl-4">
                                    {child.children.map((leaf) => (
                                      <li key={leaf.path}>
                                        <Link
                                          to={leaf.path}
                                          onClick={closeDrawer}
                                          className={`menu-dropdown-item group w-full text-left ${
                                            // Exact match - see the sibling-leaf note above.
                                            location.pathname === leaf.path
                                              ? "menu-dropdown-item-active"
                                              : "menu-dropdown-item-inactive"
                                          }`}
                                        >
                                          {leaf.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
}
