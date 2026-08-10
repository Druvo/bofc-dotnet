import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  EyeOutlined,
  TeamOutlined,
  MenuOutlined,
} from "@ant-design/icons";

interface MobileTabBarProps {
  onOpenMore: () => void;
}

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

const TABS: TabItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined />, path: "/dashboard" },
  { key: "match-center", label: "Match Center", icon: <EyeOutlined />, path: "/match-day-viewer" },
  { key: "players", label: "Players", icon: <TeamOutlined />, path: "/players" },
  { key: "more", label: "More", icon: <MenuOutlined /> },
];

/**
 * Mobile-only (<768px) persistent bottom nav so the highest-frequency
 * destinations - dashboard, live score/fixtures, roster - are one tap away
 * instead of hamburger -> drawer -> menu item. "More" opens the exact same
 * sidebar drawer the header hamburger already does (onOpenMore), so Finance/
 * Venue/Club Rules/Auction/Profile stay reachable without duplicating nav.
 * Desktop (>=768px) renders nothing - layout/Sidebar.tsx is the nav there.
 */
export default function MobileTabBar({ onOpenMore }: MobileTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (tab: TabItem) => {
    if (!tab.path) return false;
    if (tab.path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav
      className="mobile-tab-bar"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 58,
        display: "flex",
        background: "var(--color-paper-2)",
        borderTop: "1px solid var(--color-rule)",
        // Below layout/Sidebar.tsx's mobile overlay (999) and Sider (1000)
        // so an open "More" drawer correctly covers the tab bar, not the
        // other way around.
        zIndex: 998,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <button
            key={tab.key}
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
