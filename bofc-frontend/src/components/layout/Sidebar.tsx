import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUserRoles } from "../../state/slices/loginInfoSlice";
import useAuctionEnabled from "../../hooks/useAuctionEnabled";
import companyLogo from "../../assets/logo.png";

/**
 * TailAdmin Free v2.3.0 sidebar (src/partials/sidebar.html), ported from
 * Alpine.js to React. Menu content is BOFC's own IA, not TailAdmin's demo
 * pages — only the visual
 * shell/interaction pattern is TailAdmin's. Icons are TailAdmin's own inline
 * SVGs, reassigned to the closest-fitting BOFC concept.
 *
 * Alpine's single shared `selected` (persisted to localStorage, only one
 * dropdown group open at a time) becomes useState + a small localStorage
 * read/write here. Alpine's `page === '...'` string comparisons become
 * useLocation() path matching — the natural React equivalent.
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

const DashboardIcon = (
  <path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z"
  />
);
const ProfileIcon = (
  <path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
  />
);
const FormsIcon = (
  <path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H18.5001C19.7427 20.75 20.7501 19.7426 20.7501 18.5V5.5C20.7501 4.25736 19.7427 3.25 18.5001 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H18.5001C18.9143 4.75 19.2501 5.08579 19.2501 5.5V18.5C19.2501 18.9142 18.9143 19.25 18.5001 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V5.5ZM6.25005 9.7143C6.25005 9.30008 6.58583 8.9643 7.00005 8.9643L17 8.96429C17.4143 8.96429 17.75 9.30008 17.75 9.71429C17.75 10.1285 17.4143 10.4643 17 10.4643L7.00005 10.4643C6.58583 10.4643 6.25005 10.1285 6.25005 9.7143ZM6.25005 14.2857C6.25005 13.8715 6.58583 13.5357 7.00005 13.5357H17C17.4143 13.5357 17.75 13.8715 17.75 14.2857C17.75 14.6999 17.4143 15.0357 17 15.0357H7.00005C6.58583 15.0357 6.25005 14.6999 6.25005 14.2857Z"
  />
);
const TablesIcon = (
  <path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M3.25 5.5C3.25 4.25736 4.25736 3.25 5.5 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V18.5C20.75 19.7426 19.7426 20.75 18.5 20.75H5.5C4.25736 20.75 3.25 19.7426 3.25 18.5V5.5ZM5.5 4.75C5.08579 4.75 4.75 5.08579 4.75 5.5V8.58325L19.25 8.58325V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H5.5ZM19.25 10.0833H15.416V13.9165H19.25V10.0833ZM13.916 10.0833L10.083 10.0833V13.9165L13.916 13.9165V10.0833ZM8.58301 10.0833H4.75V13.9165H8.58301V10.0833ZM4.75 18.5V15.4165H8.58301V19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5ZM10.083 19.25V15.4165L13.916 15.4165V19.25H10.083ZM15.416 19.25V15.4165H19.25V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15.416Z"
  />
);
const ChartsIcon = (
  <path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M12 2C11.5858 2 11.25 2.33579 11.25 2.75V12C11.25 12.4142 11.5858 12.75 12 12.75H21.25C21.6642 12.75 22 12.4142 22 12C22 6.47715 17.5228 2 12 2ZM12.75 11.25V3.53263C13.2645 3.57761 13.7659 3.66843 14.25 3.80098V3.80099C15.6929 4.19606 16.9827 4.96184 18.0104 5.98959C19.0382 7.01734 19.8039 8.30707 20.199 9.75C20.3316 10.2341 20.4224 10.7355 20.4674 11.25H12.75ZM2 12C2 7.25083 5.31065 3.27489 9.75 2.25415V3.80099C6.14748 4.78734 3.5 8.0845 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C15.9155 20.5 19.2127 17.8525 20.199 14.25H21.7459C20.7251 18.6894 16.7492 22 12 22C6.47715 22 2 17.5229 2 12Z"
  />
);
/** Reuses the "forms" glyph — a settings/config page reads fine under the same icon family as Club Rules. */
const SettingsIcon = FormsIcon;
const ArrowDownIcon = (
  <path d="M4.79175 7.39584L10.0001 12.6042L15.2084 7.39585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
);

interface SidebarProps {
  sidebarToggle: boolean;
  setSidebarToggle: (value: boolean) => void;
  sidebarExpanded: boolean;
}

export default function Sidebar({ sidebarToggle, sidebarExpanded }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const roles = useSelector(selectUserRoles);
  const isUserAdmin = roles.includes("ADMIN") || roles.includes("SUPERADMIN");
  const auctionEnabled = useAuctionEnabled();

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
      label: "Next Match",
      icon: ChartsIcon,
      matchPrefixes: ["/match-day", "/tournament-viewer"],
      children: [{ label: "Next Match", path: "/match-day" }],
    },
    {
      key: "tournaments",
      label: "Match Management",
      icon: ChartsIcon,
      matchPrefixes: ["/tournaments", "/venues", "/auction"],
      children: [
        { label: "MatchDays", path: "/tournaments" },
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
        { label: "My Player Profile", path: "/profile" },
        { label: "Player Statistics", path: "/player-statistics" },
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

  const isGroupActive = (group: NavGroup) =>
    group.matchPrefixes.some((prefix) =>
      prefix === "/" ? location.pathname === "/" : location.pathname.startsWith(prefix)
    );

  useEffect(() => {
    const active = visibleGroups.find(isGroupActive);
    if (active && active.key !== selectedGroup) {
      setSelectedGroup(active.key);
    }
    // Only re-run when the route changes — opening/closing a group manually
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
  // sub-menus (no room to show them) — clicking a multi-child group icon
  // navigates to its first child instead of opening the dropdown. Mobile
  // ignores this entirely: it's always full-width, shown/hidden via translate.
  const collapsed = !sidebarExpanded;

  return (
    <aside
      className={`sidebar fixed left-0 top-0 z-sticky flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-black lg:static lg:translate-x-0 lg:px-3 ${
        sidebarToggle ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "lg:!w-[90px]" : "lg:!w-[290px]"}`}
      style={{ transition: "width 0.2s ease-in-out" }}
    >
      <div className={`flex items-center gap-2 pb-4 pt-5 ${collapsed ? "lg:justify-center" : "justify-between"}`}>
        <button onClick={() => navigate("/")} className="flex items-center">
          <img src={companyLogo} alt="BOFC" className="h-12 w-12 shrink-0" />
          <span className={`ml-2 text-3xl font-semibold text-gray-800 dark:text-white ${collapsed ? "lg:hidden" : ""}`}>BOFC</span>
        </button>
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

                return (
                  <li key={group.key}>
                    <button
                      type="button"
                      title={collapsed ? group.label : undefined}
                      onClick={() => {
                        if (hasSingleChild && onlyChild) navigate((onlyChild as NavLeaf).path);
                        else if (collapsed) {
                          const firstLeaf = group.children.find((c): c is NavLeaf => !isSubGroup(c)) ?? (isSubGroup(group.children[0]) ? group.children[0].children[0] : undefined);
                          if (firstLeaf) navigate(firstLeaf.path);
                        } else toggleGroup(group.key);
                      }}
                      className={`menu-item group w-full ${collapsed ? "lg:justify-center" : ""} ${active ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <svg
                        className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {group.icon}
                      </svg>
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
                    </button>

                    {!hasSingleChild && (
                      <div className={`overflow-hidden ${collapsed ? "lg:hidden" : ""} ${open ? "block" : "hidden"}`}>
                        <ul className="menu-dropdown mt-2 flex flex-col gap-1 pl-9">
                          {group.children.map((child) => {
                            if (!isSubGroup(child)) {
                              return (
                                <li key={child.path}>
                                  <button
                                    type="button"
                                    onClick={() => navigate(child.path)}
                                    className={`menu-dropdown-item group w-full text-left ${
                                      location.pathname.startsWith(child.path)
                                        ? "menu-dropdown-item-active"
                                        : "menu-dropdown-item-inactive"
                                    }`}
                                  >
                                    {child.label}
                                  </button>
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
                                        <button
                                          type="button"
                                          onClick={() => navigate(leaf.path)}
                                          className={`menu-dropdown-item group w-full text-left ${
                                            location.pathname.startsWith(leaf.path)
                                              ? "menu-dropdown-item-active"
                                              : "menu-dropdown-item-inactive"
                                          }`}
                                        >
                                          {leaf.label}
                                        </button>
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
