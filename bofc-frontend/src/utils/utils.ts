import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * The backend only assigns matchDayStatus once (at creation) and relies on a slow
 * cron job (3x/day) or an admin manually concluding it to advance it further - so a
 * matchDay can sit at stale UPCOMING/ONGOING long past its actual window. Anywhere
 * a status is displayed, derive the effective status in real time from the MatchDay's
 * own start + duration instead of trusting the raw field:
 *   now < start           -> UPCOMING
 *   start <= now < end    -> ONGOING
 *   now >= end            -> CONCLUDED
 * CONCLUDED is treated as terminal (an admin's explicit ConcludeMatchDayAsync call)
 * and never resurrected by date math. durationMinutes defaults to 90 when unset.
 */
/**
 * Bangladesh has no DST and is a fixed UTC+6 - so "Dhaka wall-clock minus 6 hours" is always
 * the true UTC instant a naive matchDayDate string represents. `new Date(matchDayDate)` on a
 * "YYYY-MM-DDTHH:mm:ss" string with no offset parses it as the *viewer's own* local time per
 * the JS spec, not Dhaka's - for any viewer not already in Asia/Dhaka, comparing that against
 * `new Date()` (the real current instant) computes UPCOMING/ONGOING/CONCLUDED against the
 * wrong absolute instant. Building the UTC millis directly from the string's components sidesteps
 * the viewer's timezone entirely, unlike showBdLocalTime's regex approach - which only ever
 * needs to relabel-and-display the given numbers, never compare them against "now".
 */
const BD_UTC_OFFSET_HOURS = 6;

const bdNaiveToUtcMillis = (timeString: string): number | null => {
    const match = timeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;
    const [, year, month, day, hour, minute, second] = match;
    return Date.UTC(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hour, 10) - BD_UTC_OFFSET_HOURS,
        parseInt(minute, 10),
        second ? parseInt(second, 10) : 0
    );
};

export const getEffectiveMatchDayStatus = (
    status?: string,
    matchDayDate?: string,
    durationMinutes?: number | null
): string => {
    if (!matchDayDate) return status || "";
    if (status === "CONCLUDED") return status;
    if (status !== "UPCOMING" && status !== "ONGOING") return status || "";

    const startMillis = bdNaiveToUtcMillis(matchDayDate);
    if (startMillis == null) return status || "";

    const endMillis = startMillis + (durationMinutes ?? 90) * 60_000;
    const nowMillis = Date.now();

    if (nowMillis < startMillis) return "UPCOMING";
    if (nowMillis < endMillis) return "ONGOING";
    return "CONCLUDED";
};

/**
 * The backend sends naive datetime strings ("2026-09-02T18:00:00", no offset) that already
 * represent Bangladesh wall-clock time - there is nothing to convert. Parsing this through
 * `new Date()` and re-formatting with an explicit timeZone would first localize it to
 * whatever timezone the *viewer's browser* happens to be in and only then reinterpret it as
 * Asia/Dhaka, silently shifting the displayed value for any viewer not already in that zone
 * (and previously this also added a redundant manual +6h on top, double-shifting even for
 * Dhaka-local viewers - e.g. 18:00 rendering as the next day's 00:00). Parse the components
 * directly instead so the displayed value is always exactly what the backend recorded.
 */
export const showBdLocalTime = (timeString: string) => {
    if (!timeString) return "";

    const match = timeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return "";

    const [, year, month, day, hourStr, minuteStr] = match;
    const hour24 = parseInt(hourStr, 10);
    const period = hour24 >= 12 ? "pm" : "am";
    const hour12 = ((hour24 + 11) % 12) + 1;

    return `${day}/${month}/${year}, ${String(hour12).padStart(2, "0")}:${minuteStr} ${period}`;
};

/**
 * Parses the same naive "YYYY-MM-DDTHH:mm[:ss]" backend string showBdLocalTime does, but
 * returns a real Date (via the local-component constructor, not the ISO-string one) so
 * duration arithmetic - add N minutes, roll over midnight/month/year - works correctly.
 * Reading it back with local getters (getHours/getDate/etc, never getUTCHours) always
 * reproduces the exact wall-clock numbers that were parsed, regardless of the viewer's
 * actual system timezone - same "don't convert, just relabel" contract as showBdLocalTime.
 */
const parseBdNaiveDateTime = (timeString?: string | null): Date | null => {
    if (!timeString) return null;
    const match = timeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;

    const [, year, month, day, hour, minute, second] = match;
    return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        second ? parseInt(second, 10) : 0
    );
};

const formatBdDate = (date: Date, dateOnly = false) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    if (dateOnly) return `${day}/${month}/${year}`;

    const hour24 = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, "0");
    const period = hour24 >= 12 ? "pm" : "am";
    const hour12 = ((hour24 + 11) % 12) + 1;

    return `${day}/${month}/${year}, ${String(hour12).padStart(2, "0")}:${minute} ${period}`;
};

/** Start + durationMinutes -> the projected end Date, using the same naive-local parsing as showBdLocalTime. Defaults duration to 90 when unset, mirroring getEffectiveMatchDayStatus. Null if start can't be parsed. */
export const getMatchDayEndDate = (start?: string | null, durationMinutes?: number | null): Date | null => {
    const startDate = parseBdNaiveDateTime(start);
    if (!startDate) return null;
    return new Date(startDate.getTime() + (durationMinutes ?? 90) * 60_000);
};

/**
 * "Starts – Ends" range for display, e.g. "09/08/2026, 06:00 pm – 07:30 pm" (end collapses
 * to time-only when it lands on the same calendar day as the start; shows the full end date
 * too if the duration pushes it past midnight).
 */
export const showBdLocalTimeRange = (start?: string | null, durationMinutes?: number | null): string => {
    const startDate = parseBdNaiveDateTime(start);
    if (!startDate) return "";
    const end = new Date(startDate.getTime() + (durationMinutes ?? 90) * 60_000);

    const sameDay =
        startDate.getFullYear() === end.getFullYear() &&
        startDate.getMonth() === end.getMonth() &&
        startDate.getDate() === end.getDate();

    const startStr = formatBdDate(startDate);
    const endStr = sameDay ? formatBdDate(end).split(", ")[1] : formatBdDate(end);
    return `${startStr} – ${endStr}`;
};

export const checkTockenValidity = (tokenContent: string) => {
    if (!tokenContent) return false;

    const contentData = JSON.parse(tokenContent);

    const decodedToken = JSON.parse(atob(contentData.token.split(".")[1]));
    const now = new Date();
    const exp = new Date(decodedToken.exp * 1000);
    if (exp < now) return false;
    return true;
};

/**
 * Function to export data to Excel
 * @param data - The JSON data to be exported
 * @param filename - The name of the Excel file to be saved
 */
export function exportToExcel(data: any[], filename: string) {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate Excel file (XLSX format)
    const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
    });

    // Save the file using file-saver
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}.xlsx`);
}

/**
 * Function to export data to CSV
 * @param data - The JSON data to be exported
 * @param filename - The name of the CSV file to be saved
 */
export function exportToCSV(data: any[], filename: string) {
    // Convert JSON data to CSV
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Save the CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
}

/**
 * Simple hash function for storing credentials securely
 * @param text - The text to hash
 * @returns hashed string
 */
export const hashCredentials = (text: string): string => {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return btoa(hash.toString() + text.length);
};

/**
 * Set a cookie with an expiration date
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Number of days before cookie expires
 */
export const setCookie = (name: string, value: string, days: number): void => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

/**
 * Get a cookie by name
 * @param name - Cookie name
 * @returns Cookie value or empty string if not found
 */
export const getCookie = (name: string): string => {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return "";
};

/**
 * Delete a cookie by name
 * @param name - Cookie name
 */
export const deleteCookie = (name: string): void => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
};

/**
 * Store credentials in cookies with hashing
 * @param email - User email
 * @param password - User password
 */
export const storeCredentials = (email: string, password: string): void => {
    const hashedEmail = hashCredentials(email);
    const hashedPassword = hashCredentials(password);
    const credentialsData = JSON.stringify({
        email: hashedEmail,
        password: hashedPassword,
        originalEmail: email,
        originalPassword: password // Store the actual password (encrypted) for auto-login
    });
    setCookie('rememberedCredentials', btoa(credentialsData), 30); // Base64 encode and store for 30 days
};

/**
 * Retrieve and verify stored credentials
 * @param email - Email to verify
 * @param password - Password to verify
 * @returns boolean indicating if credentials match
 */
export const verifyStoredCredentials = (email: string, password: string): boolean => {
    const stored = getCookie('rememberedCredentials');
    if (!stored) return false;
    
    try {
        const { email: storedEmail, password: storedPassword } = JSON.parse(atob(stored));
        return hashCredentials(email) === storedEmail && hashCredentials(password) === storedPassword;
    } catch {
        return false;
    }
};

/**
 * Get stored credentials if remembered
 * @returns stored credentials or null
 */
export const getStoredCredentials = (): { email: string, password: string } | null => {
    const stored = getCookie('rememberedCredentials');
    if (!stored) return null;
    
    try {
        const { originalEmail, originalPassword } = JSON.parse(atob(stored));
        return { email: originalEmail, password: originalPassword };
    } catch {
        return null;
    }
};

/**
 * Get stored email if credentials are remembered
 * @returns stored email or empty string
 */
export const getStoredEmail = (): string => {
    const credentials = getStoredCredentials();
    return credentials ? credentials.email : '';
};

/**
 * Check if user has saved credentials
 * @returns boolean indicating if credentials exist
 */
export const hasStoredCredentials = (): boolean => {
    return !!getCookie('rememberedCredentials');
};

/**
 * Clear stored credentials
 */
export const clearStoredCredentials = (): void => {
    deleteCookie('rememberedCredentials');
};
