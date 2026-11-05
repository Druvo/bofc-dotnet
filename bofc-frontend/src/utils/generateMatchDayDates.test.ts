import {
  DEFAULT_GENERATED_MATCH_DAYS,
  getGeneratedMatchDayDates,
  isValidMatchDayCount,
} from "./generateMatchDayDates";

/**
 * SPEC: spec-a6f59e. Generate creates exactly N Match Days on the chosen weekday, week by week
 * from the first matching date on or after the 1st of the start month, into later months as needed.
 */

const WEDNESDAY = 3;
const SUNDAY = 0;

const isoDates = (startMonth: string, weekday: number, count: number) =>
  getGeneratedMatchDayDates(startMonth, weekday, count).map((d) => d.format("YYYY-MM-DD"));

describe("generated Match Day dates", () => {
  it("defaults to 2 Match Days", () => {
    expect(DEFAULT_GENERATED_MATCH_DAYS).toBe(2);
  });

  it("creates the first two matching dates of the start month for a count of 2", () => {
    expect(isoDates("2026-09", WEDNESDAY, 2)).toEqual(["2026-09-02", "2026-09-09"]);
  });

  it("runs past a four-Wednesday month into the next month for a count of 6", () => {
    expect(isoDates("2026-02", WEDNESDAY, 6)).toEqual([
      "2026-02-04",
      "2026-02-11",
      "2026-02-18",
      "2026-02-25",
      "2026-03-04",
      "2026-03-11",
    ]);
  });

  it("creates exactly the overridden count of 3", () => {
    expect(isoDates("2026-09", WEDNESDAY, 3)).toEqual(["2026-09-02", "2026-09-09", "2026-09-16"]);
  });

  it("starts on the 1st when the 1st is the chosen weekday", () => {
    expect(isoDates("2026-04", WEDNESDAY, 2)).toEqual(["2026-04-01", "2026-04-08"]);
  });

  it("starts on the first matching date after the 1st when the 1st is another weekday", () => {
    // 2026-11-01 is a Sunday, so the first Wednesday is the 4th and the first Sunday is the 1st.
    expect(isoDates("2026-11", WEDNESDAY, 1)).toEqual(["2026-11-04"]);
    expect(isoDates("2026-11", SUNDAY, 1)).toEqual(["2026-11-01"]);
  });

  it("keeps going week by week across a year boundary", () => {
    expect(isoDates("2026-12", WEDNESDAY, 8)).toEqual([
      "2026-12-02",
      "2026-12-09",
      "2026-12-16",
      "2026-12-23",
      "2026-12-30",
      "2027-01-06",
      "2027-01-13",
      "2027-01-20",
    ]);
  });

  it("returns no dates without a start month or with a count outside 1-8", () => {
    expect(isoDates("", WEDNESDAY, 2)).toEqual([]);
    expect(isoDates("2026-13", WEDNESDAY, 2)).toEqual([]);
    expect(isoDates("2026-09", WEDNESDAY, 0)).toEqual([]);
    expect(isoDates("2026-09", WEDNESDAY, 9)).toEqual([]);
    expect(isoDates("2026-09", WEDNESDAY, NaN)).toEqual([]);
  });
});

describe("isValidMatchDayCount", () => {
  it("accepts whole numbers from 1 to 8", () => {
    for (let n = 1; n <= 8; n++) expect(isValidMatchDayCount(n)).toBe(true);
  });

  it("rejects 0, 9, NaN and fractions", () => {
    [0, 9, NaN, 2.5, -1].forEach((n) => expect(isValidMatchDayCount(n)).toBe(false));
  });
});
