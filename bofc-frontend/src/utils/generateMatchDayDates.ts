import dayjs from "dayjs";

/**
 * SPEC: spec-a6f59e. Date maths for the Match Days screen's Generate button: exactly N Match Days
 * on a weekday, week by week from a start month, where N comes from the "Auto generated match
 * number" setting (the modal may override it for one run, within the same 1-8 range).
 */

export const MIN_GENERATED_MATCH_DAYS = 1;
export const MAX_GENERATED_MATCH_DAYS = 8;
export const DEFAULT_GENERATED_MATCH_DAYS = 2;

/** True only for a whole number from 1 to 8. */
export function isValidMatchDayCount(count: number): boolean {
  return Number.isInteger(count) && count >= MIN_GENERATED_MATCH_DAYS && count <= MAX_GENERATED_MATCH_DAYS;
}

/**
 * The first `count` dates falling on `weekday` (0-6, dayjs .day() convention), starting from the
 * first one on or after the 1st of `startMonth` ("YYYY-MM") and running into later months as
 * needed. Empty when the month is missing/invalid or the count is outside 1-8.
 */
export function getGeneratedMatchDayDates(startMonth: string, weekday: number, count: number): dayjs.Dayjs[] {
  // Month checked by hand - dayjs rolls "2026-13-01" over into January instead of rejecting it.
  if (!startMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth) || !isValidMatchDayCount(count)) return [];
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return [];
  const monthStart = dayjs(`${startMonth}-01`);
  if (!monthStart.isValid()) return [];

  const first = monthStart.add((weekday - monthStart.day() + 7) % 7, "day");
  return Array.from({ length: count }, (_, i) => first.add(i * 7, "day"));
}
