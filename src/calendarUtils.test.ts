import { describe, expect, it } from "vitest";
import {
  getChallengeDates,
  getIsoWeekNumber,
  getMondayFirstOffset,
  isAllowedLogDate,
} from "./calendarUtils";

describe("calendar utilities", () => {
  it("includes every day from challenge start through challenge end", () => {
    expect(getChallengeDates("2026-09-01", "2026-09-03")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("returns the correct ISO week number", () => {
    expect(getIsoWeekNumber("2026-01-01")).toBe(1);
    expect(getIsoWeekNumber("2026-12-31")).toBe(53);
  });

  it("aligns calendar weeks with Monday as the first day", () => {
    expect(getMondayFirstOffset("2026-10-05")).toBe(0);
    expect(getMondayFirstOffset("2026-10-04")).toBe(6);
  });

  it("allows logging only within challenge dates up to today", () => {
    expect(
      isAllowedLogDate("2026-10-05", "2026-10-01", "2026-10-31", "2026-10-05"),
    ).toBe(true);
    expect(
      isAllowedLogDate("2026-10-06", "2026-10-01", "2026-10-31", "2026-10-05"),
    ).toBe(false);
    expect(
      isAllowedLogDate("2026-09-30", "2026-10-01", "2026-10-31", "2026-10-05"),
    ).toBe(false);
    expect(
      isAllowedLogDate("2026-11-01", "2026-10-01", "2026-10-31", "2026-11-05"),
    ).toBe(false);
  });
});
