import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_ID,
  DEC_24_KEY,
  FAMILIES,
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
  longestConsecutiveRun,
  longestRisingRun,
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
    totalReps: 0,
    earnedXp: 0,
    longestStreak: 0,
    daysMissed: 0,
    windowComplete: false,
    dayTotals: new Map(),
    risingDays: 0,
    maxDay: 0,
    chosenTier: 1000,
    groupSize: 0,
    finalPlacement: 0,
    midPlacement: 0,
    top3WeekEnds: 0,
    ...overrides,
  };
}

const has = (earned: ReadonlySet<string>, ...ids: string[]) =>
  ids.map((id) => earned.has(id));

describe("catalog", () => {
  it("contains 26 unique badges", () => {
    expect(ACHIEVEMENTS).toHaveLength(26);
    expect(new Set(ACHIEVEMENTS.map((badge) => badge.id)).size).toBe(26);
  });

  it("has a catalog entry for every id and family", () => {
    const familyIds = new Set(FAMILIES.map((family) => family.id));
    ACHIEVEMENTS.forEach((badge) => {
      expect(ACHIEVEMENT_BY_ID.get(badge.id)).toBe(badge);
      expect(familyIds.has(badge.family)).toBe(true);
    });
  });

  it("sorts 1..26 without gaps", () => {
    const orders = [...ACHIEVEMENTS.map((badge) => badge.sortOrder)].sort(
      (a, b) => a - b,
    );
    expect(orders).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
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
    expect(state.chosenTier).toBe(1000);
    expect(state.windowComplete).toBe(false);
    expect(state.groupSize).toBe(0);
    expect(state.finalPlacement).toBe(0);
    expect(state.midPlacement).toBe(0);
    expect(state.top3WeekEnds).toBe(0);
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

  it("grants nothing for an empty state", () => {
    expect(evaluate(makeState()).size).toBe(0);
  });
});

describe("progressFor", () => {
  it("returns count progress for streak and volume badges", () => {
    const state = makeState({ longestStreak: 3, totalReps: 742, earnedXp: 42, maxDay: 90 });
    expect(progressFor("streak.7", state)).toEqual({ kind: "count", current: 3, target: 7 });
    expect(progressFor("reps.500", state)).toEqual({ kind: "count", current: 742, target: 500 });
    expect(progressFor("reps.1k", state)).toEqual({ kind: "count", current: 742, target: 1000 });
    expect(progressFor("xp.100", state)).toEqual({ kind: "count", current: 42, target: 100 });
    expect(progressFor("day.monster", state)).toEqual({
      kind: "count",
      current: 90,
      target: MONSTER_DAY_TARGET,
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
    for (const id of ["troll.1", "troll.2", "troll.3", "troll.42", "troll.666", "date.dec24"]) {
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
    expect(badges).toHaveLength(26);
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
