import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileTopBar from "./MobileTopBar";
import OfflineBanner from "./OfflineBanner";
import { AppShellProvider } from "./AppShellContext";

/**
 * TailAdmin Free v2.3.0 page wrapper (src/index.html's root
 * `<div class="flex h-screen overflow-hidden">` + content-area/overlay/main
 * structure), ported from Alpine.js to React.
 *
 * isDarkMode/setIsDarkMode are passed in from App.tsx - that's the existing
 * source of truth (already drives AntD's ConfigProvider + localStorage
 * persistence there), not a new state. This component's only job re: dark
 * mode is applying Tailwind's expected `dark` class to <html> so `dark:`
 * utilities activate - the pre-existing AdminLayout.tsx already established
 * this exact pattern, reused here rather than re-invented.
 */

interface DefaultLayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function DefaultLayout({ children, isDarkMode, setIsDarkMode }: DefaultLayoutProps) {
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light-mode");
      root.classList.add("dark-mode");
    } else {
      root.classList.remove("dark");
      root.classList.remove("dark-mode");
      root.classList.add("light-mode");
    }
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setSidebarToggle((v) => !v);
    setSidebarExpanded((v) => !v);
  };

  return (
    <AppShellProvider onOpenSidebar={() => setSidebarToggle(true)}>
      <div className="flex h-screen overflow-hidden bg-[var(--color-paper)]">
        <Sidebar
          sidebarToggle={sidebarToggle}
          setSidebarToggle={setSidebarToggle}
          sidebarExpanded={sidebarExpanded}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <MobileTopBar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <OfflineBanner />

          {/* Small-device overlay/scrim - closes the sidebar on outside tap */}
          <div
            onClick={() => setSidebarToggle(false)}
            className={`fixed z-raised h-screen w-full bg-gray-900/50 ${sidebarToggle ? "block lg:hidden" : "hidden"}`}
          />

          <Header
            sidebarToggle={sidebarToggle}
            setSidebarToggle={toggleSidebar}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />

          <main className="bg-[var(--color-paper)]">
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </AppShellProvider>
  );
}
