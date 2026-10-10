import { describe, expect, it } from "vitest";
import {
  buildDailySeries,
  buildWeeklySeries,
  calculateStats,
  calculateStreaks,
  getIsoWeekMonday,
  sumTotalsByDate,
  toDateKey,
  toLocalDateKey,
} from "./statsUtils";

describe("toDateKey", () => {
  it("keeps plain date keys unchanged", () => {
    expect(toDateKey("2026-01-05")).toBe("2026-01-05");
  });

  it("converts full ISO timestamps to local date keys", () => {
    expect(toDateKey("2026-01-05T22:30:00.000Z")).toBe(
      toLocalDateKey(new Date("2026-01-05T22:30:00.000Z")),
    );
  });
});

describe("sumTotalsByDate", () => {
  it("adds up amounts logged on the same day", () => {
    const totals = sumTotalsByDate([
      { challengeId: 1, amount: 10, loggedAt: "2026-01-05" },
      { challengeId: 2, amount: 15, loggedAt: "2026-01-05" },
      { challengeId: 1, amount: 5, loggedAt: "2026-01-06" },
    ]);
    expect(totals.get("2026-01-05")).toBe(25);
    expect(totals.get("2026-01-06")).toBe(5);
  });

  it("returns an empty map without logs", () => {
    expect(sumTotalsByDate([]).size).toBe(0);
  });
});

describe("calculateStreaks", () => {
  it("counts consecutive days as the longest streak", () => {
    const { longest } = calculateStreaks(
      ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-10"],
      "2026-01-10",
    );
    expect(longest).toBe(3);
  });

  it("counts the current streak from today", () => {
    const { current } = calculateStreaks(
      ["2026-01-08", "2026-01-09", "2026-01-10"],
      "2026-01-10",
    );
    expect(current).toBe(3);
  });

  it("keeps the current streak alive when today is not logged yet", () => {
    const { current } = calculateStreaks(
      ["2026-01-08", "2026-01-09"],
      "2026-01-10",
    );
    expect(current).toBe(2);
  });

  it("resets the current streak after a gap", () => {
    const { current } = calculateStreaks(
      ["2026-01-01", "2026-01-05"],
      "2026-01-10",
    );
    expect(current).toBe(0);
  });

  it("returns zero streaks without any logs", () => {
    const streaks = calculateStreaks([], "2026-01-10");
    expect(streaks).toEqual({ current: 0, longest: 0 });
  });
});

describe("buildDailySeries", () => {
  it("sorts by date and builds a running total", () => {
    const series = buildDailySeries(
      new Map([
        ["2026-01-02", 20],
        ["2026-01-01", 10],
      ]),
    );
    expect(series).toEqual([
      { date: "2026-01-01", amount: 10, cumulative: 10 },
      { date: "2026-01-02", amount: 20, cumulative: 30 },
    ]);
  });
});

describe("getIsoWeekMonday", () => {
  it("maps a wednesday to the monday of its iso week", () => {
    expect(getIsoWeekMonday("2026-01-07")).toBe("2026-01-05");
  });

  it("maps a sunday to the monday of the previous week", () => {
    expect(getIsoWeekMonday("2026-01-11")).toBe("2026-01-05");
  });
});

describe("buildWeeklySeries", () => {
  it("groups daily totals per iso week", () => {
    const series = buildWeeklySeries(
      new Map([
        ["2026-01-05", 10],
        ["2026-01-07", 15],
        ["2026-01-12", 7],
      ]),
    );
    expect(series).toEqual([
      { week: "2026-01-05", label: "V2", amount: 25 },
      { week: "2026-01-12", label: "V3", amount: 7 },
    ]);
  });
});

describe("calculateStats", () => {
  it("summarizes reps, points and activity", () => {
    const stats = calculateStats(
      [
        { challengeId: 1, amount: 50, loggedAt: "2026-01-05" },
        { challengeId: 1, amount: 50, loggedAt: "2026-01-06" },
      ],
      [
        {
          challengeId: 1,
          title: "Squat-utmaningen",
          points: 100,
          chosenTier: "200",
          totalAmount: 100,
        },
      ],
      "2026-01-06",
    );

    expect(stats.totalReps).toBe(100);
    expect(stats.todayReps).toBe(50);
    expect(stats.totalPoints).toBe(50);
    expect(stats.challengeCount).toBe(1);
    expect(stats.loggedDays).toBe(2);
    expect(stats.averagePerDay).toBe(50);
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
    expect(stats.bestDay).toEqual({ date: "2026-01-05", amount: 50 });
    expect(stats.dailySeries).toHaveLength(2);
    expect(stats.weeklySeries).toHaveLength(1);
    expect(stats.challengeSeries).toEqual([
      { name: "Squat-utmaningen", earned: 50, max: 100 },
    ]);
  });

  it("returns zero values without any activity", () => {
    const stats = calculateStats([], [], "2026-01-06");
    expect(stats.totalReps).toBe(0);
    expect(stats.todayReps).toBe(0);
    expect(stats.totalPoints).toBe(0);
    expect(stats.averagePerDay).toBe(0);
    expect(stats.bestDay).toBeNull();
    expect(stats.dailySeries).toEqual([]);
    expect(stats.weeklySeries).toEqual([]);
    expect(stats.challengeSeries).toEqual([]);
  });

  it("aggregates by calendar day when logs carry full ISO timestamps", () => {
    const stats = calculateStats(
      [
        { challengeId: 1, amount: 10, loggedAt: "2026-01-05T08:30:00.000Z" },
        { challengeId: 1, amount: 5, loggedAt: "2026-01-05T21:15:00.000Z" },
        { challengeId: 1, amount: 8, loggedAt: "2026-01-06T09:00:00.000Z" },
      ],
      [],
      toLocalDateKey(new Date("2026-01-06T12:00:00Z")),
    );

    expect(stats.loggedDays).toBe(2);
    expect(stats.todayReps).toBe(8);
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
    expect(stats.dailySeries).toHaveLength(2);
    expect(stats.weeklySeries).toHaveLength(1);
    expect(stats.bestDay).toEqual({
      date: toLocalDateKey(new Date("2026-01-05T08:30:00.000Z")),
      amount: 15,
    });
  });

  it("ignores points when no tier was chosen", () => {
    const stats = calculateStats(
      [{ challengeId: 1, amount: 40, loggedAt: "2026-01-05" }],
      [
        {
          challengeId: 1,
          title: "Squat-utmaningen",
          points: 100,
          chosenTier: "Ej vald",
          totalAmount: 40,
        },
      ],
      "2026-01-05",
    );
    expect(stats.totalPoints).toBe(0);
  });

  it("sums multiple logs from today across different challenges", () => {
    const stats = calculateStats(
      [
        { challengeId: 1, amount: 20, loggedAt: "2026-01-06" },
        { challengeId: 2, amount: 15, loggedAt: "2026-01-06T12:00:00.000Z" },
        { challengeId: 1, amount: 10, loggedAt: "2026-01-05" },
      ],
      [],
      "2026-01-06",
    );

    expect(stats.todayReps).toBe(35);
  });
});
