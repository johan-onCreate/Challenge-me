import { describe, expect, it } from "vitest";
import {
  calculateEarnedPoints,
  calculateProfilePoints,
  calculateProgressPercent,
  canChangeTier,
} from "./profileUtils";

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

describe("calculateEarnedPoints", () => {
  it("awards points proportionally to progress", () => {
    expect(calculateEarnedPoints(250, "1000 squats", 100)).toBe(25);
  });

  it("does not award more than the challenge maximum", () => {
    expect(calculateEarnedPoints(1200, "1000 squats", 100)).toBe(100);
  });

  it("awards zero points without a valid target", () => {
    expect(calculateEarnedPoints(250, "Ej vald", 100)).toBe(0);
  });
});

describe("calculateProfilePoints", () => {
  const historicalChallenges = [
    { totalLoggedAmount: 500, savedTier: "1000", maximumPoints: 100 },
  ];

  it("includes current challenge XP in the total", () => {
    expect(
      calculateProfilePoints(historicalChallenges, {
        totalLoggedAmount: 250,
        savedTier: "1000",
        maximumPoints: 100,
      }),
    ).toEqual({ currentChallengePoints: 25, totalPoints: 75 });
  });

  it("updates total XP when the current challenge log amount changes", () => {
    const withFewerReps = calculateProfilePoints(historicalChallenges, {
      totalLoggedAmount: 250,
      savedTier: "1000",
      maximumPoints: 100,
    });
    const withMoreReps = calculateProfilePoints(historicalChallenges, {
      totalLoggedAmount: 500,
      savedTier: "1000",
      maximumPoints: 100,
    });

    expect(withFewerReps.totalPoints).toBe(75);
    expect(withMoreReps.totalPoints).toBe(100);
    expect(withMoreReps.currentChallengePoints).toBe(50);
  });

  it("updates current and total XP when the selected tier changes", () => {
    const lowerTier = calculateProfilePoints(historicalChallenges, {
      totalLoggedAmount: 500,
      savedTier: "1000",
      maximumPoints: 100,
    });
    const higherTier = calculateProfilePoints(historicalChallenges, {
      totalLoggedAmount: 500,
      savedTier: "2000",
      maximumPoints: 100,
    });

    expect(lowerTier).toEqual({
      currentChallengePoints: 50,
      totalPoints: 100,
    });
    expect(higherTier).toEqual({
      currentChallengePoints: 25,
      totalPoints: 75,
    });
  });

  it("keeps historical XP when there is no current challenge", () => {
    expect(calculateProfilePoints(historicalChallenges, null)).toEqual({
      currentChallengePoints: 0,
      totalPoints: 50,
    });
  });
});
