import moment from "moment";

/**
 * Format elapsed time from seconds to MM:SS format
 */
export function formatElapsedTime(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Calculate elapsed time for an ongoing match using client-side calculation
 * Similar to ElectricTeamBanner implementation
 */
export function calculateElapsedTime(
  matchStatus: string,
  startedAt: string | null | undefined,
  elapsedTimeSeconds: number | null | undefined,
  completedAt?: string | null
): number {
  if (matchStatus === "ONGOING" && startedAt) {
    const startTime = moment.utc(startedAt).local().valueOf();
    const initialElapsed = elapsedTimeSeconds || 0;
    const now = Date.now();
    const timeSinceStart = Math.floor((now - startTime) / 1000);
    return initialElapsed + timeSinceStart;
  } else if (matchStatus === "PAUSED") {
    return elapsedTimeSeconds || 0;
  } else if (matchStatus === "COMPLETED") {
    if (startedAt && completedAt) {
      const startTime = moment.utc(startedAt).local().valueOf();
      const endTime = moment.utc(completedAt).local().valueOf();
      return Math.floor((endTime - startTime) / 1000);
    }
    return elapsedTimeSeconds || 0;
  }
  return 0;
}

/**
 * Format elapsed time with label (e.g., "45:30")
 * Uses client-side calculation for ongoing matches
 */
export function formatMatchTime(
  matchStatus: string,
  startedAt: string | null | undefined,
  elapsedTimeSeconds: number | null | undefined,
  completedAt?: string | null
): string {
  const calculatedTime = calculateElapsedTime(matchStatus, startedAt, elapsedTimeSeconds, completedAt);
  return formatElapsedTime(calculatedTime);
}

/**
 * Check if a match is currently ongoing
 */
export function isMatchOngoing(status: string): boolean {
  return status === "ONGOING" || status === "PAUSED";
}

/**
 * "Starts – Ends" range for a scheduled fixture, e.g. "DD/MM/YYYY, hh:mm a – hh:mm a"
 * (end collapses to time-only when it lands on the same calendar day as the start).
 * Unlike MatchDay's naive-local matchDayDate, a Match's matchDate carries a real UTC
 * offset, so this goes through moment's normal .utc().local() conversion rather than
 * the naive-string parsing showBdLocalTime/showBdLocalTimeRange use for MatchDay.
 */
export function formatMatchTimeRange(
  matchDate: string | null | undefined,
  durationMinutes: number | null | undefined,
  dateFormat: string = "DD/MM/YYYY, hh:mm a"
): string {
  if (!matchDate) return "";
  const start = moment.utc(matchDate).local();
  const end = start.clone().add(durationMinutes || 90, "minutes");
  const sameDay = start.isSame(end, "day");
  const timeOnlyFormat = dateFormat.replace(/^.*,\s*/, "");
  return `${start.format(dateFormat)} – ${end.format(sameDay ? timeOnlyFormat : dateFormat)}`;
}

