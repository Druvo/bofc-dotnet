import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * The backend only assigns matchDayStatus once (at creation) and relies on a slow
 * cron job (3x/day) or an admin manually concluding it to advance it further — so a
 * matchDay can sit at stale UPCOMING/ONGOING long past its actual window. Anywhere
 * a status is displayed, derive the effective status in real time from the MatchDay's
 * own start + duration instead of trusting the raw field:
 *   now < start           -> UPCOMING
 *   start <= now < end    -> ONGOING
 *   now >= end            -> CONCLUDED
 * CONCLUDED is treated as terminal (an admin's explicit ConcludeMatchDayAsync call)
 * and never resurrected by date math. durationMinutes defaults to 90 when unset.
 */
export const getEffectiveMatchDayStatus = (
    status?: string,
    matchDayDate?: string,
    durationMinutes?: number | null
): string => {
    if (!matchDayDate) return status || "";
    if (status === "CONCLUDED") return status;
    if (status !== "UPCOMING" && status !== "ONGOING") return status || "";

    const start = new Date(matchDayDate);
    const end = new Date(start.getTime() + (durationMinutes ?? 90) * 60_000);
    const now = new Date();

    if (now < start) return "UPCOMING";
    if (now < end) return "ONGOING";
    return "CONCLUDED";
};

export const showBdLocalTime = (timeString: string) => {
    if (!timeString) return "";

    const localTime = new Date(timeString);
    const bdLocalTime = new Date(localTime.getTime() + 6 * 60 * 60 * 1000); // Adjusting to GMT +6

    return bdLocalTime.toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
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
