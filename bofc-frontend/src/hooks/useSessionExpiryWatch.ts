import { useEffect } from "react";
import { endExpiredSession, hasStoredSession, isStoredSessionValid } from "../utils/session";

/** A minute is well inside the shortest useful polling interval in the app (thirty seconds), so
 *  at worst a single request 401s before the watchdog notices - and the 401 handler in apiSlice
 *  catches that one anyway. Checking more often would buy nothing. */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Ends the session the moment its token expires, without waiting for a request to fail.
 *
 * The JWT lasts seven days and nothing refreshes it, so expiry always lands mid-session - very
 * often on a tab or installed PWA that has been sitting open. Until now the only expiry check ran
 * once, in a mount effect, which a long-lived tab passes exactly one time. Everything after that
 * was left to fail one request at a time.
 *
 * Both extra triggers earn their place. A backgrounded tab has its timers throttled hard (and a
 * sleeping laptop stops them entirely), so the interval alone can leave someone staring at a
 * signed-in-looking page for a while after they return to it; visibilitychange and focus catch
 * exactly that moment - coming back to the tab - which is also when they are about to click
 * something.
 */
export const useSessionExpiryWatch = () => {
    useEffect(() => {
        const check = () => {
            if (hasStoredSession() && !isStoredSessionValid()) {
                endExpiredSession();
            }
        };

        check();

        const timer = window.setInterval(check, CHECK_INTERVAL_MS);
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") check();
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", check);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("focus", check);
        };
    }, []);
};
