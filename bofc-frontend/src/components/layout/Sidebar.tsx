import React from "react";
import { Link } from "react-router-dom";
import SidebarNavContent from "./SidebarNavContent";
import companyLogo from "../../assets/logo.png";

// Re-exported so existing importers (MobileTabBar.tsx) keep working unchanged -
// the icons themselves now live in SidebarNavContent.tsx alongside the nav
// tree that uses them.
export { DashboardIcon, ProfileIcon, NextMatchIcon, FieldIcon } from "./SidebarNavContent";

/**
 * Desktop-only (>= lg) nav rail, ported from TailAdmin Free v2.3.0's Alpine
 * sidebar. Below lg, this renders nothing (`hidden lg:flex`) - MobileNavDrawer
 * (an off-canvas panel sliding in from the right, opened from the bottom tab
 * bar's "More" tab or the header hamburger) is the nav there instead, not a
 * repositioned version of this same component. The two share their actual nav
 * tree via SidebarNavContent so they can never drift apart, but they're
 * otherwise independent - collapsing this rail on desktop has no bearing on
 * the mobile drawer, and vice versa.
 */

interface SidebarProps {
  sidebarExpanded: boolean;
}

export default function Sidebar({ sidebarExpanded }: SidebarProps) {
  const collapsed = !sidebarExpanded;

  return (
    <aside
      className={`sidebar hidden h-screen flex-col border-r border-[var(--color-rule-2)] bg-[var(--color-paper-3)] px-3 lg:flex ${
        collapsed ? "lg:w-[90px]" : "lg:w-[290px]"
      }`}
      style={{ transition: "width 0.2s ease-in-out" }}
    >
      <div className={`flex items-center gap-2 pb-4 pt-5 ${collapsed ? "justify-center" : "justify-between"}`}>
        <Link to="/" className="flex items-center">
          <img src={companyLogo} alt="BOFC" className="h-12 w-12 shrink-0" />
          <span className={`ml-2 text-3xl font-semibold text-gray-800 dark:text-white ${collapsed ? "hidden" : ""}`}>BOFC</span>
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <SidebarNavContent collapsed={collapsed} onNavigate={() => {}} />
      </div>
    </aside>
  );
}
