import { describe, expect, it } from "vitest";
import { calculateProgressPercent, canChangeTier } from "./profileUtils";

describe("calculateProgressPercent", () => {
  it("calculates progress for the selected level", () => {
    expect(calculateProgressPercent(25, "100")).toBe(25);
  });

  it("caps progress at 100 percent", () => {
    expect(calculateProgressPercent(125, "100")).toBe(100);
  });

  it("returns zero when the level is missing or invalid", () => {
    expect(calculateProgressPercent(25, "")).toBe(0);
    expect(calculateProgressPercent(25, "not-a-number")).toBe(0);
  });
});

describe("canChangeTier", () => {
  const availableTiers = ["100 reps", "250 reps"];

  it("allows changing to another available level", () => {
    expect(canChangeTier("250 reps", "100 reps", availableTiers)).toBe(true);
  });

  it("does not allow saving the current level again", () => {
    expect(canChangeTier("100 reps", "100 reps", availableTiers)).toBe(false);
  });

  it("does not allow a level outside the challenge options", () => {
    expect(canChangeTier("500 reps", "100 reps", availableTiers)).toBe(false);
  });
});
