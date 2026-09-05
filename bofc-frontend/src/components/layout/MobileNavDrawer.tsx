import React, { useEffect, useRef } from "react";
import SidebarNavContent from "./SidebarNavContent";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The mobile/tablet (<lg) nav - an off-canvas panel sliding in from the RIGHT
 * (the same side as the bottom tab bar's "More" tab that opens it, so it
 * visually arrives from where you tapped), not a repositioned copy of the
 * desktop Sidebar. Replaces that component's own old left-sliding drawer
 * behavior below lg; Sidebar.tsx itself now renders nothing below lg.
 *
 * Both the panel and its backdrop stay mounted at all times and animate via
 * transform/opacity - toggling `hidden`/unmounting instead would pop instead
 * of slide and would drop the exit transition entirely.
 */
export default function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Closed drawer must not be reachable by keyboard focus even though it's
  // still in the DOM (for the slide-out transition) and only visually offset
  // via translateX - `inert` removes it (and everything inside it) from the
  // tab order and from screen-reader navigation in one call. Set imperatively
  // rather than as a JSX prop so this works regardless of the installed
  // @types/react version's HTMLAttributes coverage for `inert`.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (open) {
      el.removeAttribute("inert");
    } else {
      el.setAttribute("inert", "");
    }
  }, [open]);

  // Esc closes the drawer, same as clicking the backdrop - only listens while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className="lg:hidden">
      {/* Backdrop - always mounted, faded via opacity + pointer-events (not
          mount/unmount) so both the open and close transitions are smooth. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-navBackdrop bg-gray-900/50 transition-opacity ease-out ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ transitionDuration: "var(--dur-drawer)" }}
      />

      {/* Panel - anchored between whichever top bar is showing and the bottom
          tab bar (not full-viewport height), so its own bottom content never
          ends up hidden behind the tab bar. Both offsets are runtime CSS vars
          (see DefaultLayout for --app-header-h, tokens.css for
          --app-bottombar-h) since neither bar has one fixed height across
          every breakpoint this panel covers. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed right-0 z-navDrawer flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-l border-[var(--color-rule-2)] bg-[var(--color-paper-3)] px-3 pt-5 shadow-theme-lg transition-transform ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          top: "var(--app-header-h)",
          bottom: "var(--app-bottombar-h)",
          transitionDuration: "var(--dur-drawer)",
        }}
      >
        <SidebarNavContent collapsed={false} onNavigate={onClose} />
      </div>
    </div>
  );
}
