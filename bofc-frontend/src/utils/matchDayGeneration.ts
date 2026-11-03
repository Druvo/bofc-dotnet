import dayjs from "dayjs";

// SPEC: spec-a6f59e — the Generate Match Days modal creates exactly N Match Days, week by week
// from a start month. Bounds/default mirror MatchDayGenerationLimits on the backend.

export const AUTO_GENERATED_MATCH_NUMBER_MIN = 1;
export const AUTO_GENERATED_MATCH_NUMBER_MAX = 8;
export const AUTO_GENERATED_MATCH_NUMBER_DEFAULT = 2;

/** True only for a whole number from 1 to 8 - so an empty/NaN number input never counts as valid. */
export const isValidGenerateCount = (count: number): boolean =>
    Number.isInteger(count) && count >= AUTO_GENERATED_MATCH_NUMBER_MIN && count <= AUTO_GENERATED_MATCH_NUMBER_MAX;

/**
 * The first `count` dates falling on `weekday` (0-6, dayjs .day() convention), starting from the
 * first such date on or after the 1st of `startMonth` ("YYYY-MM") and running week by week into
 * later months as needed. Empty for a missing/invalid month or an invalid count.
 */
export const generateMatchDayDates = (startMonth: string, weekday: number, count: number): dayjs.Dayjs[] => {
    // dayjs isn't strict - "2026-13-01" would quietly roll over to next January - so check the shape first.
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth ?? "")) return [];
    if (!isValidGenerateCount(count) || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) return [];
    const monthStart = dayjs(`${startMonth}-01`);
    if (!monthStart.isValid()) return [];
    const first = monthStart.add((weekday - monthStart.day() + 7) % 7, "day");
    return Array.from({ length: count }, (_, i) => first.add(i * 7, "day"));
};
