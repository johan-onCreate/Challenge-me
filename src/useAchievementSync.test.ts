import { describe, expect, it } from "vitest";
import type { ChallengeState } from "./achievements";
import {
  fetchOwnedAchievements,
  grantAchievements,
  markAchievementsSeen,
  reconcileAchievements,
  revokeAchievements,
  syncAchievements,
} from "./useAchievementSync";

interface OwnedRow {
  achievement_id: string;
  unlocked_at: string;
  seen_at: string | null;
}

interface FakeFilter {
  op: string;
  value: unknown;
}

interface FakeCalls {
  tables: string[];
  upserts: Array<{ rows: Array<Record<string, unknown>>; onConflict?: string }>;
  updates: Array<Record<string, unknown>>;
  deletes: Array<{ filters: FakeFilter[] }>;
}

/**
 * Minimal meningsfull efterbildning av supabase-klientens kedjestyling:
 * select/eq/is/in/update returnerar kedjan, upsert löser direkt, delete
 * växlar kedjan till raderingsläge, och kedjan är then-able för await.
 */
function createFakeClient(
  ownedRows: OwnedRow[] = [],
  selectError: Error | null = null,
  deleteError: Error | null = null,
) {
  const calls: FakeCalls = { tables: [], upserts: [], updates: [], deletes: [] };

  const makeChain = () => {
    const filters: FakeFilter[] = [];
    let mode: "select" | "delete" = "select";
    const terminal = () => {
      if (mode === "delete") {
        calls.deletes.push({ filters: [...filters] });
        return Promise.resolve({ data: null, error: deleteError });
      }
      return Promise.resolve({
        data: selectError ? null : ownedRows,
        error: selectError,
      });
    };
    const chain: {
      select: () => typeof chain;
      eq: (column: string, value: unknown) => typeof chain;
      is: (column: string, value: unknown) => typeof chain;
      in: (column: string, value: unknown[]) => typeof chain;
      update: (value: Record<string, unknown>) => typeof chain;
      upsert: (
        rows: Array<Record<string, unknown>>,
        options?: { onConflict?: string },
      ) => Promise<{ data: unknown; error: null }>;
      delete: () => typeof chain;
      then: (
        onfulfilled?: ((value: { data: unknown; error: unknown }) => unknown) | null,
        onrejected?: ((error: unknown) => unknown) | null,
      ) => Promise<unknown>;
    } = {
      select: () => chain,
      eq: (column, value) => {
        filters.push({ op: `eq:${column}`, value });
        return chain;
      },
      is: (column, value) => {
        filters.push({ op: `is:${column}`, value });
        return chain;
      },
      in: (column, value) => {
        filters.push({ op: `in:${column}`, value });
        return chain;
      },
      update: (value) => {
        calls.updates.push(value);
        return chain;
      },
      upsert: (rows, options) => {
        calls.upserts.push({ rows, onConflict: options?.onConflict });
        return Promise.resolve({ data: rows, error: null });
      },
      delete: () => {
        mode = "delete";
        return chain;
      },
      then: (onfulfilled, onrejected) =>
        terminal().then(onfulfilled, onrejected),
    };
    return chain;
  };

  const client = {
    from: (table: string) => {
      calls.tables.push(table);
      if (table !== "user_achievements") {
        throw new Error(`Oväntad tabell: ${table}`);
      }
      return makeChain();
    },
  };

  return { client, calls };
}

function makeState(overrides: Partial<ChallengeState> = {}): ChallengeState {
  return {
    challengeId: 1,
    startKey: "2026-10-01",
    endKey: "2026-10-31",
    todayKey: "2026-10-15",
    totalReps: 600,
    earnedXp: 120,
    longestStreak: 10,
    daysMissed: 0,
    windowComplete: false,
    dayTotals: new Map<string, number>([["2026-10-05", 1]]),
    risingDays: 4,
    maxDay: 300,
    chosenTier: 1000,
    groupSize: 0,
    finalPlacement: 0,
    midPlacement: 0,
    top3WeekEnds: 0,
    ...overrides,
  };
}

describe("fetchOwnedAchievements", () => {
  it("maps rows to OwnedAchievement", async () => {
    const { client } = createFakeClient([
      {
        achievement_id: "troll.1",
        unlocked_at: "2026-10-05T10:00:00Z",
        seen_at: null,
      },
      {
        achievement_id: "xp.100",
        unlocked_at: "2026-10-06T11:30:00Z",
        seen_at: "2026-10-07T09:00:00Z",
      },
    ]);
    const owned = await fetchOwnedAchievements(client as never, "u-me", 1);
    expect(owned).toEqual([
      {
        achievementId: "troll.1",
        unlockedAt: "2026-10-05T10:00:00Z",
        seenAt: null,
      },
      {
        achievementId: "xp.100",
        unlockedAt: "2026-10-06T11:30:00Z",
        seenAt: "2026-10-07T09:00:00Z",
      },
    ]);
  });

  it("throws on query error", async () => {
    const boom = new Error("Böj ner");
    const { client } = createFakeClient([], boom);
    await expect(
      fetchOwnedAchievements(client as never, "u-me", 1),
    ).rejects.toThrow("Böj ner");
  });
});

describe("grantAchievements", () => {
  it("is a no-op for an empty list", async () => {
    const { client, calls } = createFakeClient();
    await grantAchievements(client as never, "u-me", 1, []);
    expect(calls.upserts).toEqual([]);
  });

  it("upserts with the composite key as conflict target", async () => {
    const { client, calls } = createFakeClient();
    await grantAchievements(client as never, "u-me", 7, ["troll.1", "xp.100"]);
    expect(calls.upserts).toEqual([
      {
        rows: [
          { user_id: "u-me", challenge_id: 7, achievement_id: "troll.1" },
          { user_id: "u-me", challenge_id: 7, achievement_id: "xp.100" },
        ],
        onConflict: "user_id,challenge_id,achievement_id",
      },
    ]);
  });
});

describe("syncAchievements", () => {
  it("grants only the missing badges and reports them as new", async () => {
    const { client, calls } = createFakeClient([
      { achievement_id: "reps.500", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    // Tillståndet uppfyller bl.a. reps.500, reps.1k? Nej (600 < 1000),
    // xp.100, streak.7, day.combo, troll.1, day.monster
    const result = await syncAchievements(client as never, "u-me", 1, makeState());

    const freshIds = calls.upserts[0]?.rows.map(
      (row) => row.achievement_id,
    ) as string[];
    expect(freshIds).not.toContain("reps.500");
    expect(freshIds).toContain("xp.100");
    expect(freshIds).toContain("streak.7");
    expect(freshIds).toContain("troll.1");

    const ownedIds = result.owned.map((entry) => entry.achievementId);
    expect(ownedIds).toContain("reps.500");
    expect(ownedIds).toContain("xp.100");
    expect(result.owned).toHaveLength(ownedIds.length);

    expect(result.newlyUnlocked.map((badge) => badge.id)).toEqual(freshIds);
    expect(result.newlyUnlocked.every((badge) => badge.title.length > 0)).toBe(true);
  });

  it("returns an empty unlock list when nothing is new", async () => {
    const satisfied = makeState();
    // Inga uppfyllda badgar utom dem som redan är ägda
    const { client, calls } = createFakeClient([
      { achievement_id: "xp.100", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "streak.7", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "troll.1", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "day.combo", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "day.monster", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "reps.500", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    const result = await syncAchievements(client as never, "u-me", 1, satisfied);
    expect(calls.upserts).toEqual([]);
    expect(result.newlyUnlocked).toEqual([]);
    expect(result.owned).toHaveLength(6);
  });

  it("never revokes — the fast path lacks tier-group data", async () => {
    // Användaren äger en tävlingsbadge (uppnådd i fullt spår). Snabbspåret
    // saknar tier-gruppsdata och FÅR därför inte radera — annars skulle
    // legitima tävlingsbadgar försvinna.
    const { client, calls } = createFakeClient([
      { achievement_id: "comp.throne", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    const result = await syncAchievements(client as never, "u-me", 1, makeState());
    expect(calls.deletes).toEqual([]);
    expect(result.owned.map((entry) => entry.achievementId)).toContain("comp.throne");
  });
});

describe("revokeAchievements", () => {
  it("is a no-op for an empty list", async () => {
    const { client, calls } = createFakeClient();
    await revokeAchievements(client as never, "u-me", 1, []);
    expect(calls.deletes).toEqual([]);
  });

  it("deletes only the given badges scoped to user and challenge", async () => {
    const { client, calls } = createFakeClient();
    await revokeAchievements(client as never, "u-me", 7, ["reps.1k", "day.monster"]);
    expect(calls.deletes).toHaveLength(1);
    const { filters } = calls.deletes[0];
    expect(filters).toContainEqual({ op: "eq:user_id", value: "u-me" });
    expect(filters).toContainEqual({ op: "eq:challenge_id", value: 7 });
    expect(filters).toContainEqual({
      op: "in:achievement_id",
      value: ["reps.1k", "day.monster"],
    });
    expect(calls.tables).toEqual(["user_achievements"]);
  });

  it("throws on delete error", async () => {
    const boom = new Error("Kan inte radera");
    const { client } = createFakeClient([], null, boom);
    await expect(
      revokeAchievements(client as never, "u-me", 1, ["reps.1k"]),
    ).rejects.toThrow("Kan inte radera");
  });
});

describe("reconcileAchievements", () => {
  it("revokes stale badges, keeps valid ones, and adds fresh ones", async () => {
    // Äger reps.500, reps.1k, xp.100. Tillståndet (600 reps) uppfyller
    // reps.500 + xp.100 men INTE reps.1k (600 < 1000) → reps.1k raderas.
    const { client, calls } = createFakeClient([
      { achievement_id: "reps.500", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "reps.1k", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "xp.100", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    const result = await reconcileAchievements(client as never, "u-me", 1, makeState());

    const deleted = (
      calls.deletes[0]?.filters.find((f) => f.op === "in:achievement_id")?.value ??
      []
    ) as string[];
    expect(deleted).toEqual(["reps.1k"]);

    const ownedIds = result.owned.map((entry) => entry.achievementId);
    expect(ownedIds).not.toContain("reps.1k");
    expect(ownedIds).toContain("reps.500");
    expect(ownedIds).toContain("xp.100");

    const freshIds = calls.upserts[0]?.rows.map(
      (row) => row.achievement_id,
    ) as string[];
    expect(result.newlyUnlocked.map((badge) => badge.id)).toEqual(freshIds);
    expect(freshIds).not.toContain("reps.1k");
  });

  it("does not revoke when everything is still satisfied", async () => {
    const { client, calls } = createFakeClient([
      { achievement_id: "reps.500", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "xp.100", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "streak.7", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "troll.1", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "day.combo", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
      { achievement_id: "day.monster", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    const result = await reconcileAchievements(client as never, "u-me", 1, makeState());
    expect(calls.deletes).toEqual([]);
    expect(result.owned).toHaveLength(6);
  });

  it("keeps sticky max-over-history badges (streak) that are still satisfied", async () => {
    // longestStreak är ett max-över-historiken-mått: en gång uppnådd
    // radera den aldrig (så länge den fortfarande uppfylls).
    const { client, calls } = createFakeClient([
      { achievement_id: "streak.30", unlocked_at: "2026-10-05T10:00:00Z", seen_at: null },
    ]);
    const result = await reconcileAchievements(
      client as never,
      "u-me",
      1,
      makeState({ longestStreak: 30 }),
    );
    expect(calls.deletes).toEqual([]);
    expect(result.owned.map((entry) => entry.achievementId)).toContain("streak.30");
  });
});

describe("markAchievementsSeen", () => {
  it("updates only unseen rows for the user and challenge", async () => {
    const { client, calls } = createFakeClient();
    await markAchievementsSeen(client as never, "u-me", 7);
    expect(calls.updates).toHaveLength(1);
    expect(calls.updates[0].seen_at).toBeTruthy();
    expect(calls.tables).toEqual(["user_achievements"]);
  });
});
