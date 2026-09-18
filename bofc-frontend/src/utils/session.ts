/**
 * One place that decides whether the stored session is still usable, and one way to end it.
 *
 * The problem this exists to solve: the JWT lasts seven days and nothing refreshes it, so every
 * session eventually dies mid-use. The app used to notice only at page load - `App` checked the
 * expiry once in a mount effect, and the route guard asked merely whether `token` was a non-empty
 * string - so a tab left open across the expiry instant carried on looking signed in while every
 * request came back 401. Production logs showed one such tab still polling `notifications/me`
 * every thirty seconds five days after its token had expired, raising an error toast each time.
 *
 * Both request layers (RTK Query and the axios instance) and the expiry watchdog funnel through
 * here so they cannot disagree about what "signed in" means. This module deliberately imports
 * nothing from `utils`, so that `utils.checkTockenValidity` can delegate here rather than keeping
 * a second copy of the decoding.
 */

const TOKEN_STORAGE_KEY = "tokenContent";

/** localStorage throws in private-mode Safari and when site data is blocked; treat that as
 *  "no session" rather than letting it take the app down. */
const readStoredSession = (): string | null => {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
};

/**
 * The token's expiry as epoch milliseconds, or 0 for anything unreadable.
 *
 * Unreadable and expired are the same answer - this session cannot be used - so callers need only
 * compare against the clock. Returning rather than throwing matters because this runs inside a
 * repeating timer, where an exception would be both invisible and fatal to the watchdog.
 */
const readExpiry = (tokenContent: string): number => {
    try {
        const { token } = JSON.parse(tokenContent);
        const { exp } = JSON.parse(atob(token.split(".")[1]));
        return typeof exp === "number" ? exp * 1000 : 0;
    } catch {
        return 0;
    }
};

/** Decoding costs a base64 decode and two JSON parses, and validity is checked from render paths
 *  - the header re-renders on every keystroke in the global search. The stored string changes
 *  only at sign-in, so decode it once and compare timestamps thereafter. */
let cachedTokenContent: string | null = null;
let cachedExpiresAt = 0;

const expiryOf = (tokenContent: string): number => {
    if (tokenContent !== cachedTokenContent) {
        cachedTokenContent = tokenContent;
        cachedExpiresAt = readExpiry(tokenContent);
    }
    return cachedExpiresAt;
};

/** Whether a given stored-session string is still within its lifetime. Backs the long-standing
 *  `checkTockenValidity` in utils, which now delegates here. */
export const isTokenContentValid = (tokenContent: string): boolean =>
    !!tokenContent && expiryOf(tokenContent) > Date.now();

/** Whether the browser is holding a session at all, valid or not. This is the guard that keeps
 *  the public match-day viewer working: a 401 for someone who never signed in is an endpoint
 *  saying "this needs auth", not a session that has run out, and bouncing them to the login page
 *  would be wrong. */
export const hasStoredSession = (): boolean => !!readStoredSession();

export const isStoredSessionValid = (): boolean => {
    const tokenContent = readStoredSession();
    return !!tokenContent && isTokenContentValid(tokenContent);
};

/** Latched for the lifetime of the page. A single screen can have a dozen queries in flight, and
 *  when the token dies they all fail at once - without this they would each start a navigation. */
let sessionEnded = false;

/**
 * Clear the dead session and send the user somewhere they can sign in again.
 *
 * Safe to call from anywhere, any number of times. `replace` rather than `href` so the page they
 * were on - which they can no longer load - does not sit in history waiting for the back button.
 * The full page load is deliberate: it rebuilds the Redux store from a now-empty localStorage, so
 * no stale slice survives.
 *
 * Note what is NOT cleared: credentials the user asked the browser to remember. Expiry is the
 * clock running out, not the user asking to be signed out, and "remember me" exists precisely so
 * they do not have to retype their password every time. Left in place, the login page's
 * auto-login picks them up on arrival and the seven-day expiry becomes a flicker rather than an
 * interruption. An explicit logout still clears them - see useAuthHook.
 */
export const endExpiredSession = (): void => {
    if (sessionEnded) return;
    sessionEnded = true;

    try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
        // Nothing useful to do if storage is unavailable - the redirect still has to happen.
    }

    window.location.replace("/login?expired=1");
};

/**
 * True when a 401 means "your session ran out" rather than "the credentials you just typed are
 * wrong". The backend answers both with 401 (see AuthService: an unknown email, a bad password,
 * and a mismatched current password on change-password all return Unauthorized), so a blanket
 * handler would sign people out for mistyping their own password on the login form.
 */
export const isExpiredSessionResponse = (status: unknown, url: unknown): boolean => {
    if (status !== 401) return false;
    const path = String(url ?? "").replace(/^\/+/, "");
    if (path.startsWith("auth/")) return false;
    return hasStoredSession();
};
