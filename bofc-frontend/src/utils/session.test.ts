import { hasStoredSession, isExpiredSessionResponse, isStoredSessionValid } from "./session";

/**
 * These cover the two judgements that caused the bug this module was written for, and the one
 * that a careless fix would introduce.
 *
 * The bug: a seven-day token expires while a tab is open, and nothing notices, so the app keeps
 * making requests that can only 401 - one every thirty seconds from the notification poll, each
 * raising an error toast, while the UI still looks signed in.
 *
 * The careless fix: treat every 401 as an expired session. The backend answers a wrong password
 * with 401 as well, so that would sign people out for mistyping their own password.
 */

const storeToken = (expSecondsFromNow: number) => {
    const payload = btoa(JSON.stringify({ sub: "a@b.c", exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }));
    localStorage.setItem("tokenContent", JSON.stringify({ token: `header.${payload}.signature` }));
};

beforeEach(() => localStorage.clear());

describe("isStoredSessionValid", () => {
    it("accepts a session that has not run out yet", () => {
        storeToken(60 * 60);
        expect(isStoredSessionValid()).toBe(true);
    });

    it("rejects a session whose token has expired", () => {
        storeToken(-1);
        expect(isStoredSessionValid()).toBe(false);
    });

    it("notices expiry the moment it passes, without the stored value changing", () => {
        // The case the app actually hits: nothing re-writes localStorage, the clock simply moves
        // past the expiry while the tab sits open. The decoded expiry is cached, so this also
        // guards against that cache going stale in the one way that matters.
        storeToken(30);
        expect(isStoredSessionValid()).toBe(true);

        jest.spyOn(Date, "now").mockReturnValue(Date.now() + 31_000);
        expect(isStoredSessionValid()).toBe(false);
        jest.restoreAllMocks();
    });

    it("rejects, rather than throws, on unreadable storage", () => {
        // Reached from a repeating timer, where an exception would be silent and would stop the
        // watchdog dead.
        localStorage.setItem("tokenContent", "not json");
        expect(() => isStoredSessionValid()).not.toThrow();
        expect(isStoredSessionValid()).toBe(false);
    });

    it("reports no session when nothing is stored", () => {
        expect(hasStoredSession()).toBe(false);
        expect(isStoredSessionValid()).toBe(false);
    });
});

describe("isExpiredSessionResponse", () => {
    it("treats a 401 on a normal endpoint as an expired session", () => {
        storeToken(-1);
        expect(isExpiredSessionResponse(401, "notifications/me?offSet=0&pageSize=5")).toBe(true);
    });

    it("does not sign the user out when the login endpoint rejects a password", () => {
        storeToken(60 * 60);
        expect(isExpiredSessionResponse(401, "auth/login")).toBe(false);
    });

    it("does not sign the user out when change-password rejects the current password", () => {
        storeToken(60 * 60);
        expect(isExpiredSessionResponse(401, "auth/change-password")).toBe(false);
    });

    it("ignores a leading slash when deciding whether a path is an auth endpoint", () => {
        storeToken(60 * 60);
        expect(isExpiredSessionResponse(401, "/auth/login")).toBe(false);
    });

    it("leaves the signed-out match-day viewer alone", () => {
        // No stored session: a 401 here means the endpoint needs auth, not that anything expired,
        // and redirecting a public page to the login screen would be wrong.
        expect(isExpiredSessionResponse(401, "match-days/details?matchDayId=16")).toBe(false);
    });

    it("ignores statuses that are not 401", () => {
        storeToken(60 * 60);
        expect(isExpiredSessionResponse(403, "settings")).toBe(false);
        expect(isExpiredSessionResponse(500, "settings")).toBe(false);
        expect(isExpiredSessionResponse("FETCH_ERROR", "settings")).toBe(false);
    });
});
