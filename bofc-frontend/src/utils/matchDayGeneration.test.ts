import { generateMatchDayDates, isValidGenerateCount } from "./matchDayGeneration";

/**
 * SPEC: spec-a6f59e. Generate used to create one Match Day for every matching weekday in a single
 * month (4 or 5); it now creates exactly N, week by week from the start month into later months.
 */

const WEDNESDAY = 3;
const datesOf = (startMonth: string, weekday: number, count: number) =>
  generateMatchDayDates(startMonth, weekday, count).map((d) => d.format("YYYY-MM-DD"));

describe("generateMatchDayDates", () => {
  it("starts on the 1st when the month starts on that weekday", () => {
    // April 2026 starts on a Wednesday.
    expect(datesOf("2026-04", WEDNESDAY, 2)).toEqual(["2026-04-01", "2026-04-08"]);
  });

  it("starts on the first matching date when the month starts mid-week", () => {
    // September 2026 starts on a Tuesday.
    expect(datesOf("2026-09", WEDNESDAY, 2)).toEqual(["2026-09-02", "2026-09-09"]);
  });

  it("runs into the next month once the start month's matching dates are used up", () => {
    // February 2026 has exactly four Wednesdays.
    expect(datesOf("2026-02", WEDNESDAY, 6)).toEqual([
      "2026-02-04",
      "2026-02-11",
      "2026-02-18",
      "2026-02-25",
      "2026-03-04",
      "2026-03-11",
    ]);
  });

  it("crosses from December into January of the next year", () => {
    expect(datesOf("2026-12", WEDNESDAY, 6)).toEqual([
      "2026-12-02",
      "2026-12-09",
      "2026-12-16",
      "2026-12-23",
      "2026-12-30",
      "2027-01-06",
    ]);
  });

  it("returns exactly the requested count, all on the chosen weekday", () => {
    const dates = generateMatchDayDates("2026-11", 5, 8);
    expect(dates).toHaveLength(8);
    dates.forEach((d) => expect(d.day()).toBe(5));
  });

  it("returns nothing for an empty or invalid start month", () => {
    expect(datesOf("", WEDNESDAY, 2)).toEqual([]);
    expect(datesOf("2026-13", WEDNESDAY, 2)).toEqual([]);
    expect(datesOf("not-a-month", WEDNESDAY, 2)).toEqual([]);
  });

  it("returns nothing for a count outside 1-8", () => {
    expect(datesOf("2026-09", WEDNESDAY, 0)).toEqual([]);
    expect(datesOf("2026-09", WEDNESDAY, 9)).toEqual([]);
  });
});

describe("isValidGenerateCount", () => {
  it("accepts 1 to 8", () => {
    expect(isValidGenerateCount(1)).toBe(true);
    expect(isValidGenerateCount(2)).toBe(true);
    expect(isValidGenerateCount(8)).toBe(true);
  });

  it("rejects 0, 9, fractions and NaN", () => {
    expect(isValidGenerateCount(0)).toBe(false);
    expect(isValidGenerateCount(9)).toBe(false);
    expect(isValidGenerateCount(2.5)).toBe(false);
    expect(isValidGenerateCount(NaN)).toBe(false);
  });
});
