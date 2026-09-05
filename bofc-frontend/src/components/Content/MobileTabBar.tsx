import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MenuOutlined } from "@ant-design/icons";
import { DashboardIcon, NextMatchIcon, FieldIcon, ProfileIcon } from "../layout/Sidebar";

interface MobileTabBarProps {
  onOpenMore: () => void;
}

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

// Icons reused straight from layout/Sidebar.tsx (not redrawn) so the bottom
// nav and the sidebar/drawer always show the exact same glyph per section.
const TABS: TabItem[] = [
  { key: "dashboard", label: "Dashboard", icon: DashboardIcon, path: "/dashboard" },
  { key: "match-day", label: "Next Match", icon: NextMatchIcon, path: "/match-day" },
  { key: "match-center", label: "Match Center", icon: FieldIcon, path: "/match-day-viewer" },
  { key: "players", label: "Players", icon: ProfileIcon, path: "/players" },
  { key: "more", label: "More", icon: <MenuOutlined /> },
];

/**
 * Mobile/tablet-only (<lg, 1024px - see ContentComponent's showMobileNav)
 * persistent bottom nav so the highest-frequency destinations - dashboard,
 * next match day, live score/fixtures, roster - are one tap away instead of
 * hamburger -> drawer -> menu item. "More" opens the same off-canvas nav
 * drawer (layout/MobileNavDrawer.tsx) the header hamburger does
 * (onOpenMore), so Finance/Venue/Club Rules/Settings stay reachable without
 * duplicating nav. Desktop (>=lg) renders nothing there - layout/Sidebar.tsx
 * is the nav.
 */
export default function MobileTabBar({ onOpenMore }: MobileTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (tab: TabItem) => {
    if (!tab.path) return false;
    if (tab.path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    // Exact-match "/match-day" first - startsWith alone would also match
    // "/match-day-viewer" (Match Center's own path) and light up both tabs.
    if (tab.path === "/match-day") {
      return location.pathname === "/match-day";
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav
      className="mobile-tab-bar z-bottomBar"
      aria-label="Primary"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 58,
        display: "flex",
        background: "var(--color-paper-2)",
        borderTop: "1px solid var(--color-rule)",
        // Above the nav drawer/backdrop (see tailwind.config.js's navDrawer/
        // navBackdrop tiers) so "More" stays clickable - and thus able to
        // close the drawer again - even while it's open.
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <button
            key={tab.key}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            onClick={() => (tab.path ? navigate(tab.path) : onOpenMore())}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              border: "none",
              background: "transparent",
              color: active ? "var(--color-accent)" : "var(--color-muted)",
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
