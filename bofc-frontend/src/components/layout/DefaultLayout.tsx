import React, { useEffect, useLayoutEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileTopBar from "./MobileTopBar";
import MobileNavDrawer from "./MobileNavDrawer";
import OfflineBanner from "./OfflineBanner";
import { AppShellProvider } from "./AppShellContext";

/** Matches tailwind.config.js's `lg` screen - the same breakpoint the desktop
 * Sidebar/Header switch on (`lg:flex`/`md:flex`...`lg:border-b` etc.) and the
 * one the mobile nav drawer/bottom tab bar switch off at (`lg:hidden`). Kept
 * as one constant so the JS-side breakpoint check below can't drift from the
 * CSS classes that draw the actual chrome. */
const LG_BREAKPOINT = 1024;

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
  // Two independent concerns behind one hamburger button (Header.tsx's), since
  // below lg there's no rail to collapse and at lg+ there's no drawer to open:
  //  - sidebarExpanded: desktop (>=lg) icon-rail collapse state.
  //  - drawerOpen: mobile/tablet (<lg) off-canvas nav drawer state.
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth >= LG_BREAKPOINT) {
      setSidebarExpanded((v) => !v);
    } else {
      setDrawerOpen((v) => !v);
    }
  };

  // Neither MobileTopBar (mobile) nor Header (tablet/desktop) has one fixed
  // height - Header alone goes from a single row to two stacked rows between
  // md and lg. MobileNavDrawer anchors its top edge to whichever of the two is
  // actually rendered (only one is, via their own responsive classes) rather
  // than a guessed constant, so it never starts under/over the real header.
  //
  // Measured by querying [data-app-header-bar] (set on both bars' own root
  // element) rather than wrapping them in a ref'd container - wrapping them
  // made that wrapper the sticky bar's containing block, and since the
  // wrapper was sized to exactly the bar's own height, there was zero room
  // left for it to ever actually stick: it scrolled away with its container
  // the instant the page moved. Querying the DOM directly measures each bar
  // in place, in its original flat position among Sidebar's siblings, where
  // `sticky` has the whole scrollable column as its containing block.
  //
  // useLayoutEffect (not useEffect) so the var is set before the browser
  // paints the drawer's first frame, not one tick after.
  useLayoutEffect(() => {
    const bars = Array.from(document.querySelectorAll<HTMLElement>("[data-app-header-bar]"));
    if (bars.length === 0) return;
    const setHeaderHeightVar = () => {
      // Exactly one of the two is ever visible (their own md:hidden/hidden
      // md:flex classes are complementary) - the hidden one reports 0, so
      // the max is always the real, currently-visible bar's height.
      const height = Math.max(...bars.map((el) => el.offsetHeight));
      document.documentElement.style.setProperty("--app-header-h", `${height}px`);
    };
    setHeaderHeightVar();
    const resizeObserver = new ResizeObserver(setHeaderHeightVar);
    bars.forEach((el) => resizeObserver.observe(el));
    return () => resizeObserver.disconnect();
  }, []);

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

  return (
    <AppShellProvider onOpenSidebar={() => setDrawerOpen(true)}>
      <div className="flex h-screen overflow-hidden bg-[var(--color-paper)]">
        <Sidebar sidebarExpanded={sidebarExpanded} />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <MobileTopBar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <OfflineBanner />

          <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

          <Header
            sidebarToggle={drawerOpen}
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
