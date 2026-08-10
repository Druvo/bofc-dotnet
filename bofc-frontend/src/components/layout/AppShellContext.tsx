import React, { createContext, useContext, useState } from "react";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import {
  isNotificationsEnabled,
  isNotificationSupported,
  requestNotificationPermission,
  setNotificationsEnabled,
} from "../../utils/browserNotifications";

/**
 * Shared "app shell" UI state - was local useState inside ContentComponent
 * back when it owned both the header chrome AND these drawer/modal triggers.
 * Now that TailAdmin's Header (in DefaultLayout) is a sibling of
 * ContentComponent rather than its parent, the trigger buttons and the
 * drawer/modal that respond to them need a shared place to live. Business
 * logic (query refetching, permission requests) is unchanged - only *where*
 * the boolean visibility state is held has moved.
 */

interface AppShellContextValue {
  goalkeepingHistoryOpen: boolean;
  openGoalkeepingHistory: () => void;
  closeGoalkeepingHistory: () => void;

  notificationsOn: boolean;
  notificationsSupported: boolean;
  toggleNotifications: (checked: boolean) => Promise<void>;

  canInstall: boolean;
  promptInstall: () => void;

  /** Opens the sidebar drawer - the state itself lives in DefaultLayout (it also
   * owns the desktop icon-rail collapse behavior), passed in via onOpenSidebar so
   * that deeply-nested triggers like MobileTabBar's "More" button (a sibling of
   * Sidebar, not a descendant, so it can't just receive the setter as a prop) can
   * reach it without threading a callback through every intermediate component. */
  openSidebar: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children, onOpenSidebar }: { children: React.ReactNode; onOpenSidebar?: () => void }) {
  const [goalkeepingHistoryOpen, setGoalkeepingHistoryOpen] = useState(false);
  const [notificationsOn, setNotificationsOnState] = useState(isNotificationsEnabled());
  const { canInstall, promptInstall } = usePwaInstall();

  const toggleNotifications = async (checked: boolean) => {
    if (checked) {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        setNotificationsEnabled(false);
        setNotificationsOnState(false);
        return;
      }
    }
    setNotificationsEnabled(checked);
    setNotificationsOnState(checked);
  };

  const value: AppShellContextValue = {
    goalkeepingHistoryOpen,
    openGoalkeepingHistory: () => setGoalkeepingHistoryOpen(true),
    closeGoalkeepingHistory: () => setGoalkeepingHistoryOpen(false),
    notificationsOn,
    notificationsSupported: isNotificationSupported(),
    toggleNotifications,
    canInstall,
    promptInstall,
    openSidebar: () => onOpenSidebar?.(),
  };

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return ctx;
}
