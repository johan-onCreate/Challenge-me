import { describe, expect, it } from "vitest";
import {
  calculateTargetAveragePerDay,
  calculateTargetProgress,
  getTargetAmount,
} from "./leaderboardUtils";

describe("leaderboard target calculations", () => {
  it("reads the numeric target from a level label", () => {
    expect(getTargetAmount("1000 squats")).toBe(1000);
  });

  it("calculates the target average across the full challenge", () => {
    expect(calculateTargetAveragePerDay("1000 squats", 10)).toBe(100);
  });

  it("reaches the target on the final challenge day", () => {
    expect(calculateTargetProgress("1000 squats", 10, 10)).toBe(1000);
  });

  it("returns zero for invalid targets or day counts", () => {
    expect(calculateTargetAveragePerDay("Ej vald", 10)).toBe(0);
    expect(calculateTargetAveragePerDay("1000 squats", 0)).toBe(0);
  });
});
