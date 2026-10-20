import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_ID,
  BLACK_FRIDAY_KEY,
  DEC_24_KEY,
  FAMILIES,
  HALLOWEEN_KEY,
  MONSTER_DAY_TARGET,
  MYTHIC_TARGET,
  type ChallengeState,
  addDays,
  buildChallengeState,
  buildWallBadges,
  countMissedDays,
  diffDays,
  eachDay,
  evaluate,
  firstToReachGoal,
  hasReturnAfterGap,
  longestConsecutiveRun,
  longestConstantRun,
  longestRisingRun,
  longestZeroRunAfterLog,
  maxRollingWindowTotal,
  midpointKey,
  progressFor,
  rankAtDate,
  top3WeekEndStreak,
  weekEndSnapshots,
  type TierParticipant,
} from "./achievements";

const days = (entries: Array<[string, number]>): Map<string, number> =>
  new Map(entries);

function makeState(overrides: Partial<ChallengeState> = {}): ChallengeState {
  return {
    challengeId: 1,
    startKey: "2026-10-01",
    endKey: "2026-10-31",
    todayKey: "2026-10-15",
    userId: "u-me",
    totalReps: 0,
    earnedXp: 0,
    longestStreak: 0,
    daysMissed: 0,
    windowComplete: false,
    dayTotals: new Map(),
    risingDays: 0,
    maxDay: 0,
    constantDays: 0,
    weekTotal: 0,
    maxZeroRun: 0,
    chosenTier: 1000,
    groupSize: 0,
    finalPlacement: 0,
    midPlacement: 0,
    top3WeekEnds: 0,
    goatWinner: null,
    ...overrides,
  };
}

const has = (earned: ReadonlySet<string>, ...ids: string[]) =>
  ids.map((id) => earned.has(id));

describe("catalog", () => {
  it("contains 44 unique badges", () => {
    expect(ACHIEVEMENTS).toHaveLength(44);
    expect(new Set(ACHIEVEMENTS.map((badge) => badge.id)).size).toBe(44);
  });

  it("has a catalog entry for every id and family", () => {
    const familyIds = new Set(FAMILIES.map((family) => family.id));
    ACHIEVEMENTS.forEach((badge) => {
      expect(ACHIEVEMENT_BY_ID.get(badge.id)).toBe(badge);
      expect(familyIds.has(badge.family)).toBe(true);
    });
  });

  it("sorts 1..44 without gaps", () => {
    const orders = [...ACHIEVEMENTS.map((badge) => badge.sortOrder)].sort(
      (a, b) => a - b,
    );
    expect(orders).toEqual(Array.from({ length: 44 }, (_, i) => i + 1));
  });
});

describe("date helpers", () => {
  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("diffDays counts days between keys", () => {
    expect(diffDays("2026-10-01", "2026-10-01")).toBe(0);
    expect(diffDays("2026-10-01", "2026-10-15")).toBe(14);
    expect(diffDays("2026-10-15", "2026-10-01")).toBe(-14);
  });

  it("eachDay is inclusive and empty when start > end", () => {
    expect(eachDay("2026-10-01", "2026-10-03")).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
    expect(eachDay("2026-10-03", "2026-10-01")).toEqual([]);
  });

  it("midpointKey splits the window in half", () => {
    expect(midpointKey("2026-10-01", "2026-10-31")).toBe("2026-10-16");
    expect(midpointKey("2026-10-01", "2026-10-01")).toBe("2026-10-01");
  });
});

describe("longestConsecutiveRun", () => {
  it("is 0 with no logged days", () => {
    expect(longestConsecutiveRun(new Set(), "2026-10-01", "2026-10-07")).toBe(0);
  });

  it("counts a full consecutive span", () => {
    const logged = new Set(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(longestConsecutiveRun(logged, "2026-10-01", "2026-10-07")).toBe(3);
  });

  it("finds the longest span across gaps", () => {
    const logged = new Set([
      "2026-10-01",
      "2026-10-02",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
    ]);
    expect(longestConsecutiveRun(logged, "2026-10-01", "2026-10-07")).toBe(3);
  });

  it("ignores days outside the window", () => {
    const logged = new Set(["2026-09-30", "2026-10-01"]);
    expect(longestConsecutiveRun(logged, "2026-10-01", "2026-10-07")).toBe(1);
  });
});

describe("countMissedDays", () => {
  it("counts unlogged days in the window", () => {
    const logged = new Set(["2026-10-01", "2026-10-03"]);
    expect(countMissedDays(logged, "2026-10-01", "2026-10-05")).toBe(3);
  });

  it("is 0 when every day is logged", () => {
    const logged = new Set(eachDay("2026-10-01", "2026-10-03"));
    expect(countMissedDays(logged, "2026-10-01", "2026-10-03")).toBe(0);
  });
});

describe("longestRisingRun", () => {
  it("is 0 with no logs", () => {
    expect(longestRisingRun(new Map(), "2026-10-01", "2026-10-07")).toBe(0);
  });

  it("counts strictly increasing consecutive days", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-02", 20],
      ["2026-10-03", 30],
    ]);
    expect(longestRisingRun(totals, "2026-10-01", "2026-10-07")).toBe(3);
  });

  it("does not count plateaus as rising", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-02", 20],
      ["2026-10-03", 20],
      ["2026-10-04", 30],
    ]);
    expect(longestRisingRun(totals, "2026-10-01", "2026-10-07")).toBe(2);
  });

  it("restarts at 1 after a drop", () => {
    const totals = days([
      ["2026-10-01", 30],
      ["2026-10-02", 10],
      ["2026-10-03", 20],
    ]);
    expect(longestRisingRun(totals, "2026-10-01", "2026-10-07")).toBe(2);
  });

  it("breaks on unlogged days", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-03", 20],
      ["2026-10-04", 30],
    ]);
    expect(longestRisingRun(totals, "2026-10-01", "2026-10-07")).toBe(2);
  });
});

describe("longestConstantRun", () => {
  it("is 0 with no logs", () => {
    expect(longestConstantRun(new Map(), "2026-10-01", "2026-10-07")).toBe(0);
  });

  it("counts consecutive days with identical totals", () => {
    const totals = days([
      ["2026-10-01", 25],
      ["2026-10-02", 25],
      ["2026-10-03", 25],
    ]);
    expect(longestConstantRun(totals, "2026-10-01", "2026-10-07")).toBe(3);
  });

  it("breaks on a changed amount", () => {
    const totals = days([
      ["2026-10-01", 25],
      ["2026-10-02", 25],
      ["2026-10-03", 26],
      ["2026-10-04", 26],
      ["2026-10-05", 26],
    ]);
    expect(longestConstantRun(totals, "2026-10-01", "2026-10-07")).toBe(3);
  });

  it("breaks on unlogged days", () => {
    const totals = days([
      ["2026-10-01", 25],
      ["2026-10-03", 25],
      ["2026-10-04", 25],
    ]);
    expect(longestConstantRun(totals, "2026-10-01", "2026-10-07")).toBe(2);
  });
});

describe("maxRollingWindowTotal", () => {
  it("is 0 with no logs", () => {
    expect(maxRollingWindowTotal(new Map(), "2026-10-01", "2026-10-07", 7)).toBe(0);
  });

  it("sums the best 7-day window", () => {
    const totals = days([
      ["2026-10-01", 200],
      ["2026-10-02", 200],
      ["2026-10-03", 200],
      ["2026-10-04", 200],
      ["2026-10-05", 200],
      ["2026-10-06", 200],
      ["2026-10-07", 200],
    ]);
    // Hela fönstret är 7 dagar: 7 * 200 = 1400
    expect(maxRollingWindowTotal(totals, "2026-10-01", "2026-10-07", 7)).toBe(1400);
  });

  it("slides the window to find the peak", () => {
    const totals = days([
      ["2026-10-01", 100],
      ["2026-10-05", 500],
      ["2026-10-06", 500],
      ["2026-10-07", 500],
      ["2026-10-08", 500],
    ]);
    // Fönstret 10-02..10-08 fångar alla 500:are = 2000
    expect(
      maxRollingWindowTotal(totals, "2026-10-01", "2026-10-08", 7),
    ).toBe(2000);
  });
});

describe("longestZeroRunAfterLog", () => {
  it("is 0 with no logs at all", () => {
    expect(longestZeroRunAfterLog(new Map(), "2026-10-01", "2026-10-07")).toBe(0);
  });

  it("ignores leading unlogged days before the first log", () => {
    const totals = days([["2026-10-06", 10]]);
    // 10-01..10-05 är tomma men FÖRE första loggen → de räknas inte,
    // endast 10-07 (efter loggen) ger 1 nolldag
    expect(longestZeroRunAfterLog(totals, "2026-10-01", "2026-10-07")).toBe(1);
  });

  it("counts zero days after a log", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-02", 10],
    ]);
    expect(longestZeroRunAfterLog(totals, "2026-10-01", "2026-10-07")).toBe(5);
  });

  it("resets the run on a logged day", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-04", 10],
    ]);
    // Gap: 10-02, 10-03 (2 dagar), sedan logg, sedan 10-05..10-07 (3 dagar)
    expect(longestZeroRunAfterLog(totals, "2026-10-01", "2026-10-07")).toBe(3);
  });
});

describe("hasReturnAfterGap", () => {
  it("requires a prior log before the gap", () => {
    // Första loggen efter 7 tomma dagar — men ingen logg innan → falskt
    const totals = days([["2026-10-08", 10]]);
    expect(hasReturnAfterGap(totals, "2026-10-01", "2026-10-31", 7, 1)).toBe(false);
  });

  it("is true for a return after the full gap", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-09", 10],
    ]);
    // 10-02..10-08 = 7 nolldagar mellan loggarna
    expect(hasReturnAfterGap(totals, "2026-10-01", "2026-10-31", 7, 1)).toBe(true);
  });

  it("is false when the gap is too short", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-08", 10],
    ]);
    // Endast 6 nolldagar (10-02..10-07)
    expect(hasReturnAfterGap(totals, "2026-10-01", "2026-10-31", 7, 1)).toBe(false);
  });

  it("respects the minimum return amount", () => {
    const short = days([
      ["2026-10-01", 10],
      ["2026-10-09", 99],
    ]);
    expect(hasReturnAfterGap(short, "2026-10-01", "2026-10-31", 7, 100)).toBe(false);
    const enough = days([
      ["2026-10-01", 10],
      ["2026-10-09", 100],
    ]);
    expect(hasReturnAfterGap(enough, "2026-10-01", "2026-10-31", 7, 100)).toBe(true);
  });

  it("is false when a log lands inside the gap", () => {
    const totals = days([
      ["2026-10-01", 10],
      ["2026-10-04", 5],
      ["2026-10-09", 100],
    ]);
    // 10-04 bryter gapet inför 10-09
    expect(hasReturnAfterGap(totals, "2026-10-01", "2026-10-31", 7, 100)).toBe(false);
  });
});

describe("firstToReachGoal", () => {
  it("is null for an empty group or non-positive goal", () => {
    expect(firstToReachGoal([], 1000)).toBeNull();
    expect(
      firstToReachGoal([{ userId: "u-a", dayTotals: days([["2026-10-01", 5000]]) }], 0),
    ).toBeNull();
  });

  it("picks the earliest cumulative passer", () => {
    const group: TierParticipant[] = [
      { userId: "u-slow", dayTotals: days([["2026-10-10", 1000]]) },
      { userId: "u-fast", dayTotals: days([["2026-10-01", 600], ["2026-10-02", 400]]) },
    ];
    expect(firstToReachGoal(group, 1000)).toBe("u-fast");
  });

  it("breaks same-day ties deterministically by userId", () => {
    const group: TierParticipant[] = [
      { userId: "u-b", dayTotals: days([["2026-10-01", 1000]]) },
      { userId: "u-a", dayTotals: days([["2026-10-01", 1000]]) },
    ];
    expect(firstToReachGoal(group, 1000)).toBe("u-a");
  });

  it("is null when nobody reaches the goal", () => {
    const group: TierParticipant[] = [
      { userId: "u-a", dayTotals: days([["2026-10-01", 999]]) },
    ];
    expect(firstToReachGoal(group, 1000)).toBeNull();
  });
});

describe("rankAtDate", () => {
  const group: TierParticipant[] = [
    { userId: "u-me", dayTotals: days([["2026-10-01", 10], ["2026-10-05", 5]]) },
    { userId: "u-a", dayTotals: days([["2026-10-01", 50]]) },
    { userId: "u-b", dayTotals: days([["2026-10-05", 30]]) },
  ];

  it("ranks by cumulative reps up to the given date", () => {
    // u-a 50, u-b 30, u-me 15
    expect(rankAtDate(group, "u-me", "2026-10-31")).toEqual({
      groupSize: 3,
      placement: 3,
    });
    expect(rankAtDate(group, "u-a", "2026-10-31").placement).toBe(1);
  });

  it("only counts logs up to and including the cutoff", () => {
    // Innan 10-05: u-a 50, u-me 10, u-b 0
    expect(rankAtDate(group, "u-me", "2026-10-03")).toEqual({
      groupSize: 3,
      placement: 2,
    });
    expect(rankAtDate(group, "u-b", "2026-10-03")).toEqual({
      groupSize: 3,
      placement: 3,
    });
  });

  it("breaks ties deterministically by userId", () => {
    const tied: TierParticipant[] = [
      { userId: "u-b", dayTotals: days([["2026-10-01", 10]]) },
      { userId: "u-a", dayTotals: days([["2026-10-01", 10]]) },
    ];
    expect(rankAtDate(tied, "u-a", "2026-10-31").placement).toBe(1);
    expect(rankAtDate(tied, "u-b", "2026-10-31").placement).toBe(2);
  });

  it("places an unknown user last", () => {
    expect(rankAtDate(group, "u-x", "2026-10-31").placement).toBe(3);
  });
});

describe("weekEndSnapshots", () => {
  it("lists Sundays plus the live end point", () => {
    // 2026-10-01 är en torsdag; söndagar: 4, 11, 18, 25
    expect(weekEndSnapshots("2026-10-01", "2026-10-31", "2026-10-27")).toEqual([
      "2026-10-04",
      "2026-10-11",
      "2026-10-18",
      "2026-10-25",
      "2026-10-27",
    ]);
  });

  it("does not duplicate when the live point is a Sunday", () => {
    expect(weekEndSnapshots("2026-10-01", "2026-10-31", "2026-10-25")).toEqual([
      "2026-10-04",
      "2026-10-11",
      "2026-10-18",
      "2026-10-25",
    ]);
  });

  it("caps at challenge end when it is before today", () => {
    expect(weekEndSnapshots("2026-10-01", "2026-10-05", "2026-10-20")).toEqual([
      "2026-10-04",
      "2026-10-05",
    ]);
  });

  it("is empty before the challenge starts", () => {
    expect(weekEndSnapshots("2026-10-01", "2026-10-31", "2026-09-30")).toEqual(
      [],
    );
  });

  it("returns only the live point when no Sunday has passed yet", () => {
    // Startar torsdag 10-01, live-punkt fredag 10-02 (före första söndagen)
    expect(weekEndSnapshots("2026-10-01", "2026-10-31", "2026-10-02")).toEqual([
      "2026-10-02",
    ]);
  });

  it("includes the start day when it is a Sunday", () => {
    expect(weekEndSnapshots("2026-10-04", "2026-10-31", "2026-10-04")).toEqual([
      "2026-10-04",
    ]);
  });
});

describe("top3WeekEndStreak", () => {
  it("is 0 for a group of one", () => {
    expect(
      top3WeekEndStreak(
        [{ userId: "u-me", dayTotals: new Map() }],
        "u-me",
        "2026-10-01",
        "2026-10-31",
        "2026-10-25",
      ),
    ).toBe(0);
  });

  it("counts three consecutive top-3 week-ends", () => {
    const group: TierParticipant[] = [
      { userId: "u-me", dayTotals: days([["2026-10-01", 30]]) },
      { userId: "u-a", dayTotals: days([["2026-10-01", 15]]) },
      { userId: "u-b", dayTotals: days([["2026-10-01", 10]]) },
      { userId: "u-c", dayTotals: days([["2026-10-01", 5]]) },
    ];
    // Snapshots: 10-04, 10-11, 10-18 (alla topp 1 för u-me)
    expect(
      top3WeekEndStreak(group, "u-me", "2026-10-01", "2026-10-31", "2026-10-18"),
    ).toBe(3);
  });

  it("stops the run when the user falls out of top 3", () => {
    const group: TierParticipant[] = [
      {
        userId: "u-me",
        dayTotals: days([
          ["2026-10-01", 10],
          ["2026-10-02", 10],
          ["2026-10-03", 10],
          ["2026-10-04", 10],
          ["2026-10-08", 10],
          ["2026-10-09", 10],
          ["2026-10-10", 10],
        ]),
      },
      {
        userId: "u-a",
        dayTotals: days([
          ["2026-10-01", 5],
          ["2026-10-19", 2000],
        ]),
      },
      {
        userId: "u-b",
        dayTotals: days([
          ["2026-10-01", 3],
          ["2026-10-19", 500],
        ]),
      },
      {
        userId: "u-c",
        dayTotals: days([["2026-10-19", 1000]]),
      },
    ];
    // 10-04, 10-11, 10-18: u-me #1. 10-25: u-a 2005, u-c 1000, u-b 503, u-me 70 → #4.
    expect(
      top3WeekEndStreak(group, "u-me", "2026-10-01", "2026-10-31", "2026-10-25"),
    ).toBe(3);
  });

  it("is 0 when the user is never in top 3", () => {
    const group: TierParticipant[] = [
      { userId: "u-me", dayTotals: days([["2026-10-01", 10]]) },
      { userId: "u-a", dayTotals: days([["2026-10-01", 1000]]) },
      { userId: "u-b", dayTotals: days([["2026-10-01", 500]]) },
      { userId: "u-c", dayTotals: days([["2026-10-01", 250]]) },
    ];
    expect(
      top3WeekEndStreak(group, "u-me", "2026-10-01", "2026-10-31", "2026-10-25"),
    ).toBe(0);
  });
});

describe("buildChallengeState", () => {
  const input = {
    challengeId: 7,
    startKey: "2026-10-01",
    endKey: "2026-10-31",
    todayKey: "2026-10-15",
    userId: "u-me",
    userDayTotals: days([
      ["2026-10-01", 10],
      ["2026-10-02", 20],
      ["2026-10-03", 30],
    ]),
    chosenTier: "1000",
    points: 100,
    tierParticipants: [] as TierParticipant[],
  };

  it("computes totals, xp, streaks and missed days", () => {
    const state = buildChallengeState(input);
    expect(state.totalReps).toBe(60);
    expect(state.maxDay).toBe(30);
    expect(state.earnedXp).toBe(6);
    expect(state.longestStreak).toBe(3);
    expect(state.daysMissed).toBe(12);
    expect(state.risingDays).toBe(3);
    expect(state.constantDays).toBe(1);
    expect(state.weekTotal).toBe(60);
    expect(state.maxZeroRun).toBe(12);
    expect(state.chosenTier).toBe(1000);
    expect(state.windowComplete).toBe(false);
    expect(state.groupSize).toBe(0);
    expect(state.finalPlacement).toBe(0);
    expect(state.midPlacement).toBe(0);
    expect(state.top3WeekEnds).toBe(0);
    expect(state.userId).toBe("u-me");
    expect(state.goatWinner).toBeNull();
  });

  it("computes the GOAT winner from the tier group", () => {
    const state = buildChallengeState({
      ...input,
      tierParticipants: [
        { userId: "u-me", dayTotals: input.userDayTotals },
        {
          userId: "u-fast",
          dayTotals: days([
            ["2026-10-01", 500],
            ["2026-10-02", 500],
          ]),
        },
      ],
    });
    expect(state.goatWinner).toBe("u-fast");
  });

  it("leaves the GOAT winner null without a real group or goat goal", () => {
    const solo = buildChallengeState({
      ...input,
      tierParticipants: [{ userId: "u-me", dayTotals: input.userDayTotals }],
    });
    expect(solo.goatWinner).toBeNull();
    const customTier = buildChallengeState({
      ...input,
      chosenTier: "500",
      tierParticipants: [
        { userId: "u-me", dayTotals: input.userDayTotals },
        { userId: "u-a", dayTotals: days([["2026-10-01", 500]]) },
      ],
    });
    expect(customTier.goatWinner).toBeNull();
  });

  it("flags windowComplete only after the end date", () => {
    expect(buildChallengeState({ ...input, todayKey: "2026-10-31" }).windowComplete).toBe(false);
    expect(buildChallengeState({ ...input, todayKey: "2026-11-01" }).windowComplete).toBe(true);
  });

  it("computes missed days over the full window when complete", () => {
    const state = buildChallengeState({ ...input, todayKey: "2026-11-01" });
    expect(state.daysMissed).toBe(28);
  });

  it("handles a challenge that has not started", () => {
    const state = buildChallengeState({ ...input, todayKey: "2026-09-30" });
    expect(state.longestStreak).toBe(0);
    expect(state.daysMissed).toBe(0);
    expect(state.windowComplete).toBe(false);
  });

  it("computes tier-group placements", () => {
    const state = buildChallengeState({
      ...input,
      tierParticipants: [
        { userId: "u-me", dayTotals: input.userDayTotals },
        { userId: "u-a", dayTotals: days([["2026-10-05", 100]]) },
        { userId: "u-b", dayTotals: days([["2026-10-05", 30]]) },
      ],
    });
    expect(state.groupSize).toBe(3);
    expect(state.finalPlacement).toBe(2);
    // Mittenpunkten (2026-10-16) har inte passerats
    expect(state.midPlacement).toBe(0);
  });

  it("computes midPlacement once the midpoint has passed", () => {
    const state = buildChallengeState({
      ...input,
      todayKey: "2026-10-20",
      tierParticipants: [
        { userId: "u-me", dayTotals: input.userDayTotals },
        { userId: "u-a", dayTotals: days([["2026-10-05", 100]]) },
        { userId: "u-b", dayTotals: days([["2026-10-05", 30]]) },
      ],
    });
    expect(state.midPlacement).toBe(2);
  });
});

describe("evaluate", () => {
  it("grants streak badges at exact thresholds", () => {
    expect(has(evaluate(makeState({ longestStreak: 6 })), "streak.7")).toEqual([false]);
    expect(has(evaluate(makeState({ longestStreak: 7 })), "streak.7")).toEqual([true]);
    expect(has(evaluate(makeState({ longestStreak: 13 })), "streak.14")).toEqual([false]);
    expect(has(evaluate(makeState({ longestStreak: 14 })), "streak.14")).toEqual([true]);
    expect(has(evaluate(makeState({ longestStreak: 21 })), "streak.21", "streak.14", "streak.7")).toEqual([true, true, true]);
    expect(has(evaluate(makeState({ longestStreak: 30 })), "streak.30")).toEqual([true]);
    expect(has(evaluate(makeState({ longestStreak: 60 })), "streak.60")).toEqual([true]);
  });

  it("grants perfect.run only for a complete window with zero missed days", () => {
    expect(
      has(evaluate(makeState({ windowComplete: true, daysMissed: 0 })), "perfect.run"),
    ).toEqual([true]);
    expect(
      has(evaluate(makeState({ windowComplete: false, daysMissed: 0 })), "perfect.run"),
    ).toEqual([false]);
    expect(
      has(evaluate(makeState({ windowComplete: true, daysMissed: 2 })), "perfect.run"),
    ).toEqual([false]);
  });

  it("grants volume badges at exact thresholds", () => {
    expect(has(evaluate(makeState({ totalReps: 499 })), "reps.500")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 500 })), "reps.500")).toEqual([true]);
    expect(has(evaluate(makeState({ totalReps: 999 })), "reps.1k")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 1000 })), "reps.1k", "reps.500")).toEqual([true, true]);
    expect(has(evaluate(makeState({ totalReps: 4999 })), "reps.5k")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 5000 })), "reps.5k")).toEqual([true]);
  });

  it("grants ascent badges as pure volume milestones", () => {
    const at1000 = evaluate(makeState({ totalReps: 1000 }));
    expect(
      has(at1000, "ascent.bronze", "ascent.silver", "ascent.gold", "ascent.platinum", "ascent.mythic"),
    ).toEqual([true, false, false, false, false]);

    const at3333 = evaluate(makeState({ totalReps: 3333 }));
    expect(
      has(at3333, "ascent.bronze", "ascent.silver", "ascent.gold", "ascent.platinum"),
    ).toEqual([true, true, false, false]);

    const at6666 = evaluate(makeState({ totalReps: 6666 }));
    expect(has(at6666, "ascent.bronze", "ascent.silver", "ascent.gold")).toEqual([
      true,
      true,
      true,
    ]);

    const at10000 = evaluate(makeState({ totalReps: 10000 }));
    expect(
      has(at10000, "ascent.bronze", "ascent.silver", "ascent.gold", "ascent.platinum", "ascent.mythic"),
    ).toEqual([true, true, true, true, false]);
  });

  it("respects exact ascent boundaries", () => {
    expect(has(evaluate(makeState({ totalReps: 999 })), "ascent.bronze")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 3332 })), "ascent.silver")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 6665 })), "ascent.gold")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 9999 })), "ascent.platinum")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 19999 })), "ascent.mythic")).toEqual([false]);
  });

  it("grants ascent regardless of chosen tier (tier changes never cost badges)", () => {
    expect(has(evaluate(makeState({ chosenTier: 0, totalReps: 1000 })), "ascent.bronze")).toEqual([
      true,
    ]);
    expect(
      has(evaluate(makeState({ chosenTier: 3333, totalReps: 1000 })), "ascent.bronze"),
    ).toEqual([true]);
    expect(
      has(evaluate(makeState({ chosenTier: 1000, totalReps: 3333 })), "ascent.silver"),
    ).toEqual([true]);
  });

  it("grants mythic as pure volume at 20 000 reps", () => {
    expect(
      has(evaluate(makeState({ chosenTier: 1000, totalReps: MYTHIC_TARGET })), "ascent.mythic"),
    ).toEqual([true]);
    expect(
      has(evaluate(makeState({ chosenTier: 1000, totalReps: MYTHIC_TARGET - 1 })), "ascent.mythic"),
    ).toEqual([false]);
  });

  it("grants all comp badges only with a real tier group", () => {
    const groupless = makeState({
      groupSize: 1,
      windowComplete: true,
      finalPlacement: 1,
      midPlacement: 1,
      top3WeekEnds: 5,
    });
    expect(
      has(evaluate(groupless), "comp.plot_twist", "comp.three_week_tyrant", "comp.throne"),
    ).toEqual([false, false, false]);
  });

  it("grants plot twist for bottom-half midpoint to top-3 finish", () => {
    const base = { groupSize: 4, windowComplete: true, midPlacement: 3 };
    expect(has(evaluate(makeState({ ...base, finalPlacement: 2 })), "comp.plot_twist")).toEqual([true]);
    // Top half in mid (3 > 4/2 är sant, 2 > 4/2 är falskt)
    expect(has(evaluate(makeState({ ...base, midPlacement: 2, finalPlacement: 2 })), "comp.plot_twist")).toEqual([false]);
    // Never top 3 at the end
    expect(has(evaluate(makeState({ ...base, finalPlacement: 4 })), "comp.plot_twist")).toEqual([false]);
    // Challenge not over yet
    expect(has(evaluate(makeState({ ...base, windowComplete: false, finalPlacement: 2 })), "comp.plot_twist")).toEqual([false]);
  });

  it("grants three-week tyrant at three consecutive top-3 week-ends", () => {
    expect(has(evaluate(makeState({ groupSize: 2, top3WeekEnds: 2 })), "comp.three_week_tyrant")).toEqual([false]);
    expect(has(evaluate(makeState({ groupSize: 2, top3WeekEnds: 3 })), "comp.three_week_tyrant")).toEqual([true]);
  });

  it("grants the throne only for #1 when the challenge is over", () => {
    expect(
      has(evaluate(makeState({ groupSize: 2, windowComplete: true, finalPlacement: 1 })), "comp.throne"),
    ).toEqual([true]);
    expect(
      has(evaluate(makeState({ groupSize: 2, windowComplete: false, finalPlacement: 1 })), "comp.throne"),
    ).toEqual([false]);
    expect(
      has(evaluate(makeState({ groupSize: 2, windowComplete: true, finalPlacement: 2 })), "comp.throne"),
    ).toEqual([false]);
  });

  it("grants trolling badges only for exact daily totals", () => {
    for (const [amount, id] of [
      [1, "troll.1"],
      [2, "troll.2"],
      [3, "troll.3"],
      [42, "troll.42"],
      [666, "troll.666"],
    ] as Array<[number, string]>) {
      const earned = evaluate(makeState({ dayTotals: days([["2026-10-05", amount]]) }));
      expect(earned.has(id), id).toBe(true);
    }
    const nearMiss = evaluate(
      makeState({ dayTotals: days([["2026-10-05", 41], ["2026-10-06", 665], ["2026-10-07", 667]]) }),
    );
    expect(
      has(nearMiss, "troll.1", "troll.2", "troll.3", "troll.42", "troll.666"),
    ).toEqual([false, false, false, false, false]);
  });

  it("counts a day at its final total (1 then +40 is 41, not Sloth)", () => {
    const earned = evaluate(makeState({ dayTotals: days([["2026-10-05", 41]]) }));
    expect(earned.has("troll.1")).toBe(false);
  });

  it("keeps Sloth when another day lands on a different exact total", () => {
    const earned = evaluate(
      makeState({ dayTotals: days([["2026-10-05", 1], ["2026-10-06", 5]]) }),
    );
    expect(earned.has("troll.1")).toBe(true);
    expect(earned.has("troll.3")).toBe(false);
  });

  it("grants baby XP at 100 earned xp", () => {
    expect(has(evaluate(makeState({ earnedXp: 99 })), "xp.100")).toEqual([false]);
    expect(has(evaluate(makeState({ earnedXp: 100 })), "xp.100")).toEqual([true]);
  });

  it("grants rolling thunder at three rising days", () => {
    expect(has(evaluate(makeState({ risingDays: 2 })), "day.combo")).toEqual([false]);
    expect(has(evaluate(makeState({ risingDays: 3 })), "day.combo")).toEqual([true]);
  });

  it("grants Santa's Rep List only on 24 december", () => {
    expect(
      has(evaluate(makeState({ dayTotals: days([[DEC_24_KEY, 10]]) })), "date.dec24"),
    ).toEqual([true]);
    expect(
      has(evaluate(makeState({ dayTotals: days([["2026-12-23", 10]]) })), "date.dec24"),
    ).toEqual([false]);
  });

  it("grants monster day at 250+ reps in a single day", () => {
    expect(has(evaluate(makeState({ maxDay: MONSTER_DAY_TARGET - 1 })), "day.monster")).toEqual([false]);
    expect(has(evaluate(makeState({ maxDay: MONSTER_DAY_TARGET })), "day.monster")).toEqual([true]);
  });

  it("grants the quadfather at 1 000 reps in a single day", () => {
    expect(has(evaluate(makeState({ maxDay: 999 })), "day.quadfather")).toEqual([false]);
    expect(has(evaluate(makeState({ maxDay: 1000 })), "day.quadfather", "day.monster")).toEqual([true, true]);
  });

  it("grants the new exact-totals trolling badges", () => {
    expect(has(evaluate(makeState({ dayTotals: days([["2026-10-05", 404]]) })), "troll.404")).toEqual([true]);
    expect(has(evaluate(makeState({ dayTotals: days([["2026-10-05", 999]]) })), "troll.999")).toEqual([true]);
    expect(has(evaluate(makeState({ dayTotals: days([["2026-10-05", 1337]]) })), "troll.1337")).toEqual([true]);
    expect(
      has(
        evaluate(makeState({ dayTotals: days([["2026-10-05", 403], ["2026-10-06", 1000], ["2026-10-07", 1336]]) })),
        "troll.404",
        "troll.999",
        "troll.1337",
      ),
    ).toEqual([false, false, false]);
  });

  it("grants Nice. only at exactly 6 969 total reps", () => {
    expect(has(evaluate(makeState({ totalReps: 6968 })), "troll.6969")).toEqual([false]);
    expect(has(evaluate(makeState({ totalReps: 6969 })), "troll.6969")).toEqual([true]);
    // Stannar inte där → priset är borta igen
    expect(has(evaluate(makeState({ totalReps: 6970 })), "troll.6969")).toEqual([false]);
  });

  it("grants the squat depression for 3 straight zero days after a log", () => {
    expect(has(evaluate(makeState({ maxZeroRun: 2 })), "troll.depression")).toEqual([false]);
    expect(has(evaluate(makeState({ maxZeroRun: 3 })), "troll.depression")).toEqual([true]);
  });

  it("grants groundhog day and the consistency paradox on constant runs", () => {
    expect(has(evaluate(makeState({ constantDays: 2 })), "streak.const3")).toEqual([false]);
    expect(has(evaluate(makeState({ constantDays: 3 })), "streak.const3")).toEqual([true]);
    expect(has(evaluate(makeState({ constantDays: 6 })), "streak.const7")).toEqual([false]);
    expect(has(evaluate(makeState({ constantDays: 7 })), "streak.const7", "streak.const3")).toEqual([true, true]);
  });

  it("grants seven days of soreness at 1 500 in a rolling week", () => {
    expect(has(evaluate(makeState({ weekTotal: 1499 })), "volume.soreness")).toEqual([false]);
    expect(has(evaluate(makeState({ weekTotal: 1500 })), "volume.soreness")).toEqual([true]);
  });

  it("grants halloween only on 31 october", () => {
    expect(has(evaluate(makeState({ dayTotals: days([[HALLOWEEN_KEY, 10]]) })), "date.halloween")).toEqual([true]);
    expect(has(evaluate(makeState({ dayTotals: days([["2026-10-30", 10]]) })), "date.halloween")).toEqual([false]);
  });

  it("grants black friday burn at 250+ reps on black friday", () => {
    expect(has(evaluate(makeState({ dayTotals: days([[BLACK_FRIDAY_KEY, 249]]) })), "date.blackfriday")).toEqual([false]);
    expect(has(evaluate(makeState({ dayTotals: days([[BLACK_FRIDAY_KEY, 250]]) })), "date.blackfriday")).toEqual([true]);
    expect(has(evaluate(makeState({ dayTotals: days([["2026-11-26", 500]]) })), "date.blackfriday")).toEqual([false]);
  });

  it("grants the comeback kid from the day totals", () => {
    // Logg 10-01, 7 nolldagar, återkomst 10-09
    const comeback = days([
      ["2026-10-01", 10],
      ["2026-10-09", 10],
    ]);
    expect(has(evaluate(makeState({ dayTotals: comeback })), "day.comeback")).toEqual([true]);
    // Första loggen efter en vecka utan — ingen logg innan → inget comeback
    const fresh = days([["2026-10-08", 10]]);
    expect(has(evaluate(makeState({ dayTotals: fresh })), "day.comeback")).toEqual([false]);
  });

  it("grants the slacker's redemption for 100+ after 3 nolldagar", () => {
    const redemption = days([
      ["2026-10-01", 10],
      ["2026-10-05", 100],
    ]);
    expect(has(evaluate(makeState({ dayTotals: redemption })), "day.redemption")).toEqual([true]);
    // Under 100 reps vid återkomsten → inget
    const weak = days([
      ["2026-10-01", 10],
      ["2026-10-05", 99],
    ]);
    expect(has(evaluate(makeState({ dayTotals: weak })), "day.redemption")).toEqual([false]);
  });

  it("grants the goat badge only to the tier-group winner", () => {
    const winner = makeState({
      userId: "u-me",
      chosenTier: 1000,
      groupSize: 2,
      goatWinner: "u-me",
    });
    expect(has(evaluate(winner), "goat.bronze")).toEqual([true]);
    expect(has(evaluate(winner), "goat.silver", "goat.gold", "goat.platinum", "goat.mythic")).toEqual([false, false, false, false]);

    // Nämannan i samma tier får ingenting
    const loser = makeState({
      userId: "u-other",
      chosenTier: 1000,
      groupSize: 2,
      goatWinner: "u-me",
    });
    expect(has(evaluate(loser), "goat.bronze")).toEqual([false]);

    // Annan tier → det badget tillhör inte din nivå
    const silver = makeState({
      userId: "u-me",
      chosenTier: 3333,
      groupSize: 2,
      goatWinner: "u-me",
    });
    expect(has(evaluate(silver), "goat.silver")).toEqual([true]);
    expect(has(evaluate(silver), "goat.bronze")).toEqual([false]);
  });

  it("never grants a goat badge without a real group", () => {
    const solo = makeState({
      userId: "u-me",
      chosenTier: 1000,
      groupSize: 1,
      goatWinner: "u-me",
    });
    expect(has(evaluate(solo), "goat.bronze")).toEqual([false]);
  });

  it("grants nothing for an empty state", () => {
    expect(evaluate(makeState()).size).toBe(0);
  });
});

describe("progressFor", () => {
  it("returns count progress for streak and volume badges", () => {
    const state = makeState({ longestStreak: 3, totalReps: 742, earnedXp: 42, maxDay: 90, weekTotal: 900 });
    expect(progressFor("streak.7", state)).toEqual({ kind: "count", current: 3, target: 7 });
    expect(progressFor("reps.500", state)).toEqual({ kind: "count", current: 742, target: 500 });
    expect(progressFor("reps.1k", state)).toEqual({ kind: "count", current: 742, target: 1000 });
    expect(progressFor("xp.100", state)).toEqual({ kind: "count", current: 42, target: 100 });
    expect(progressFor("day.monster", state)).toEqual({
      kind: "count",
      current: 90,
      target: MONSTER_DAY_TARGET,
    });
    expect(progressFor("day.quadfather", state)).toEqual({
      kind: "count",
      current: 90,
      target: 1000,
    });
    expect(progressFor("volume.soreness", state)).toEqual({
      kind: "count",
      current: 900,
      target: 1500,
    });
  });

  it("shows ascent progress for every rung, independent of tier", () => {
    const state = makeState({ chosenTier: 1000, totalReps: 742 });
    expect(progressFor("ascent.bronze", state)).toEqual({
      kind: "count",
      current: 742,
      target: 1000,
    });
    expect(progressFor("ascent.silver", state)).toEqual({
      kind: "count",
      current: 742,
      target: 3333,
    });
    expect(progressFor("ascent.gold", state)).toEqual({
      kind: "count",
      current: 742,
      target: 6666,
    });
    expect(progressFor("ascent.platinum", state)).toEqual({
      kind: "count",
      current: 742,
      target: 10000,
    });
  });

  it("always shows mythic progress", () => {
    expect(progressFor("ascent.mythic", makeState({ totalReps: 123 }))).toEqual({
      kind: "count",
      current: 123,
      target: MYTHIC_TARGET,
    });
  });

  it("shows goat progress only for your own tier goal", () => {
    const bronze = makeState({ chosenTier: 1000, totalReps: 742 });
    expect(progressFor("goat.bronze", bronze)).toEqual({
      kind: "count",
      current: 742,
      target: 1000,
    });
    expect(progressFor("goat.mythic", bronze)).toBeNull();
    const mythic = makeState({ chosenTier: 20000, totalReps: 12345 });
    expect(progressFor("goat.mythic", mythic)).toEqual({
      kind: "count",
      current: 12345,
      target: 20000,
    });
    expect(progressFor("goat.bronze", mythic)).toBeNull();
  });

  it("shows free-form text for perfect run", () => {
    expect(progressFor("perfect.run", makeState({ daysMissed: 2 }))).toEqual({
      kind: "text",
      text: "2 missade dagar",
    });
    expect(progressFor("perfect.run", makeState({ daysMissed: 0 }))).toEqual({
      kind: "text",
      text: "Inga missade dagar än",
    });
  });

  it("shows group text for comp badges only with a real group", () => {
    const grouped = makeState({ groupSize: 4, finalPlacement: 3, midPlacement: 2 });
    expect(progressFor("comp.throne", grouped)).toEqual({
      kind: "text",
      text: "Du är #3 i din grupp",
    });
    expect(progressFor("comp.three_week_tyrant", grouped)).toEqual({
      kind: "text",
      text: "Du är #3 i din grupp",
    });
    expect(progressFor("comp.plot_twist", grouped)).toEqual({
      kind: "text",
      text: "Du var #2 i halvtid",
    });
    expect(progressFor("comp.throne", makeState())).toBeNull();
    expect(progressFor("comp.plot_twist", makeState({ groupSize: 4, midPlacement: 0 }))).toBeNull();
  });

  it("returns null for trolling and santa (the hint is the joke)", () => {
    const state = makeState();
    for (const id of [
      "troll.1",
      "troll.2",
      "troll.3",
      "troll.42",
      "troll.666",
      "troll.404",
      "troll.999",
      "troll.1337",
      "troll.6969",
      "troll.depression",
      "date.dec24",
      "date.halloween",
      "date.blackfriday",
      "day.comeback",
      "day.redemption",
      "streak.const3",
      "streak.const7",
    ]) {
      expect(progressFor(id, state), id).toBeNull();
    }
    expect(progressFor("does.not.exist", state)).toBeNull();
  });
});

describe("buildWallBadges", () => {
  it("marks owned badges as earned and the rest by progress", () => {
    const state = makeState({ totalReps: 742, longestStreak: 3 });
    const badges = buildWallBadges(state, [
      { achievementId: "reps.500", unlockedAt: "2026-10-10T12:00:00Z", seenAt: null },
    ]);
    expect(badges).toHaveLength(44);
    const owned = badges.find((badge) => badge.achievement.id === "reps.500");
    expect(owned).toEqual({
      achievement: ACHIEVEMENT_BY_ID.get("reps.500"),
      state: "earned",
      progress: null,
      unlockedAt: "2026-10-10T12:00:00Z",
    });
    const reptile = badges.find((badge) => badge.achievement.id === "reps.1k");
    expect(reptile?.state).toBe("progress");
    const sloth = badges.find((badge) => badge.achievement.id === "troll.1");
    expect(sloth?.state).toBe("locked");
    expect(sloth?.progress).toBeNull();
  });

  it("keeps catalog order", () => {
    const badges = buildWallBadges(makeState(), []);
    expect(badges.map((badge) => badge.achievement.id)).toEqual(
      ACHIEVEMENTS.map((badge) => badge.id),
    );
  });
});
