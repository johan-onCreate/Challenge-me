import { describe, expect, it } from "vitest";
import { getChallengeDates, getIsoWeekNumber } from "./calendarUtils";

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
});
