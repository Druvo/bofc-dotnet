import { generateMatchDayDates, isValidGenerateCount } from "./matchDayGeneration";

/**
 * SPEC: spec-a6f59e. Generate creates exactly N Match Days on a weekday, week by week from the
 * first matching date on or after the 1st of the start month, running into later months as needed.
 */

const WEDNESDAY = 3;
const formatted = (startMonth: string, weekday: number, count: number) =>
    generateMatchDayDates(startMonth, weekday, count).map((d) => d.format("YYYY-MM-DD"));

describe("generateMatchDayDates", () => {
    it("gives the first two matching dates of the start month", () => {
        // Sep 1 2026 is a Tuesday.
        expect(formatted("2026-09", WEDNESDAY, 2)).toEqual(["2026-09-02", "2026-09-09"]);
    });

    it("runs into the next month once the start month's matching dates are used up", () => {
        // Feb 2026 has four Wednesdays.
        expect(formatted("2026-02", WEDNESDAY, 6)).toEqual([
            "2026-02-04",
            "2026-02-11",
            "2026-02-18",
            "2026-02-25",
            "2026-03-04",
            "2026-03-11",
        ]);
    });

    it("includes the 1st when it already falls on the weekday", () => {
        // Apr 1 2026 is a Wednesday.
        expect(formatted("2026-04", WEDNESDAY, 2)).toEqual(["2026-04-01", "2026-04-08"]);
    });

    it("crosses from December into January of the next year", () => {
        expect(formatted("2026-12", WEDNESDAY, 6)).toEqual([
            "2026-12-02",
            "2026-12-09",
            "2026-12-16",
            "2026-12-23",
            "2026-12-30",
            "2027-01-06",
        ]);
    });

    it("gives nothing for an empty or invalid start month", () => {
        expect(formatted("", WEDNESDAY, 2)).toEqual([]);
        expect(formatted("2026-13", WEDNESDAY, 2)).toEqual([]);
        expect(formatted("not-a-month", WEDNESDAY, 2)).toEqual([]);
    });

    it("gives nothing for a count outside 1 to 8", () => {
        expect(formatted("2026-09", WEDNESDAY, 0)).toEqual([]);
        expect(formatted("2026-09", WEDNESDAY, 9)).toEqual([]);
        expect(formatted("2026-09", WEDNESDAY, NaN)).toEqual([]);
    });
});

describe("isValidGenerateCount", () => {
    it("accepts every whole number from 1 to 8", () => {
        for (let n = 1; n <= 8; n++) expect(isValidGenerateCount(n)).toBe(true);
    });

    it("rejects 0, 9, NaN and fractions", () => {
        expect(isValidGenerateCount(0)).toBe(false);
        expect(isValidGenerateCount(9)).toBe(false);
        expect(isValidGenerateCount(NaN)).toBe(false);
        expect(isValidGenerateCount(2.5)).toBe(false);
    });
});
