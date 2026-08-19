import { useEffect, useState } from "react";
import { WifiOutlined, ReloadOutlined } from "@ant-design/icons";

/**
 * Single persistent banner for network failures, replacing the per-widget
 * "Failed to fetch" toast stack that used to fire once per failed query
 * (see apiSlice.ts's FETCH_ERROR branch, which dispatches "bofc:network-error"
 * instead of toasting).
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    window.addEventListener("bofc:network-error", goOffline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("bofc:network-error", goOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-warning-500 px-4 py-2 text-center text-theme-sm font-medium text-white">
      <WifiOutlined />
      <span>You're offline - showing the last loaded data, some info may be out of date.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-1 text-theme-xs font-semibold hover:bg-white/30"
      >
        <ReloadOutlined /> Reload
      </button>
    </div>
  );
}
