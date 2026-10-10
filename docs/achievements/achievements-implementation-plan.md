# 🛠️ Achievements — Implementation Plan

> Companion to `achievements-report.md` (the design). This plan translates the 26-badge design
> into concrete code for the Challenges Portal, grounded in the **current codebase**
> (React + Vite + Supabase + Tailwind, Swedish UI).
>
> Key discovery that shapes everything: **`/stats` and `/stats/:userId` already exist** in
> `App.tsx`, `Stats.tsx` already handles "me vs. other user", and `Leaderboard.tsx` already
> deep-links to `/stats/:userId`. The profile-page idea is ~80% built — **`App.tsx` and
> `Leaderboard.tsx` need zero changes.**

---

## 1. Decisions (design questions, settled)

| Question | Decision | Why |
|---|---|---|
| Show unearned badges? | **Yes — all 26 always visible**, 3 states: earned / in-progress (with progress line) / locked (with hint) | Progress bars drive the goal-gradient effect; locked names drive curiosity; completionism (25/26) pulls users back. Trolling badges fill the wall fast so day 1 isn't a wall of gray. |
| Can others view achievements? | **Yes** | Leaderboard already links to other users' stats; goofy names are made for social sharing; wall component takes a `userId` prop (zero extra cost). |
| Where to view? | **Profile page = `/stats` + `/stats/:userId`** with two sub-tabs: **Statistik** (existing `StatsDashboard`) and **Priser 🏆** (the wall), via `?tab=priser` query param | Reuses existing routes + leaderboard links; query param keeps `App.tsx` untouched and is deep-linkable. |
| How is a badge received? | **Layered:** ① silent DB persistence (source of truth, after every log + on load) · ② live confetti toast when the unlock happens while the user is in the app · ③ "Nya priser!" catch-up banner in the wall for badges earned while away (`seen_at` column) | Nothing is ever lost, the moment is never missed when present, and end-of-challenge badges aren't buried. |
| Wall scope | **Per-challenge** — the wall shows the active challenge (`is_active = true`); fresh wall each run | Matches the design (fresh wall = new season). |
| RLS | **Follow the codebase pattern: RLS disabled** (all existing tables have `DISABLE ROW LEVEL SECURITY`) | Consistency. Flagged as a separate hardening task for the whole app — not mixed into this feature. |

---

## 2. Architecture

```
 log upsert (Profile.tsx) ──► buildChallengeState(existing in-memory rows)
 page load /stats ─────────► buildChallengeState(fetched rows)
                                   │
                                   ▼
                          evaluate(state) ──► Set<achievementId>   (pure, tested)
                                   │
                                   ▼
                    diff vs user_achievements (owned)
                         │                │
              fresh ────┘                └── fresh ──► upsert  (+ scoped delete of stale, full path only)
                                                         │
                                        isOwn && live action?
                                          │yes             │no
                                          ▼                ▼
                                  confetti + toast    silent (wall shows
                                                       "Nya priser!" later)
```

**Pure engine, thin UI.** `evaluate()` is a pure function over plain data → trivially unit-testable
(the repo already has `*.test.ts` for every util — follow that pattern).

---

## 3. Phase 1 — Database (`sql/achievements.sql`, new file)

```sql
-- 1. Catalog (static, 26 rows). `hint` is the Swedish one-liner shown on locked badges.
CREATE TABLE IF NOT EXISTS public.achievements (
  id          TEXT PRIMARY KEY,              -- 'troll.666', 'streak.30', ...
  family      TEXT NOT NULL,                 -- 'streak'|'perfect'|'volume'|'ascent'|'comp'|'troll'|'special'
  title       TEXT NOT NULL,                 -- 'Imp'
  hint        TEXT NOT NULL,                 -- 'Exakt 666 reps på en dag'
  emoji       TEXT NOT NULL,                 -- '😈'
  goal        INT,                           -- ascent only: 1000|3333|6666|10000|20000
  sort_order  INT NOT NULL
);

-- 2. One wall PER CHALLENGE. seen_at = NULL until the user has seen it in the wall.
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id   BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at        TIMESTAMPTZ,
  PRIMARY KEY (user_id, challenge_id, achievement_id)
);

ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;  -- codebase pattern

INSERT INTO public.achievements (id, family, title, hint, emoji, goal, sort_order) VALUES
  ('streak.7',        'streak',   'A Week… What a Week',            '7 dagar i rad',                          '🔥', NULL,    1),
  ('streak.14',       'streak',   'Two Weeks of Mild Insanity',     '14 dagar i rad',                         '🔥', NULL,    2),
  ('streak.21',       'streak',   'Three Weeks, Zero Regrets (Lying)', '21 dagar i rad',                      '🔥', NULL,    3),
  ('streak.30',       'streak',   'One Month of Pure Madness',      '30 dagar i rad',                         '🌙', NULL,    4),
  ('streak.60',       'streak',   'Two Months? Are You Okay?',      '60 dagar i rad',                         '🧟', NULL,    5),
  ('perfect.run',     'perfect',  'The Human Metronome',            'Ensam dag missad, start till mål',       '⏱️', NULL,    6),
  ('reps.500',        'volume',   '500 and Counting',               '500 totala reps',                        '💪', NULL,    7),
  ('reps.1k',         'volume',   'The Reptile',                    '1 000 totala reps',                      '🦎', NULL,    8),
  ('reps.5k',         'volume',   'The Dinosaur',                   '5 000 totala reps',                      '🦖', NULL,    9),
  ('ascent.bronze',   'ascent',   'Bronze: You Showed Up',          '1 000 totala reps',                      '🥉', 1000,   10),
  ('ascent.silver',   'ascent',   'Silver: Decent, Honestly',       '3 333 totala reps',                      '🥈', 3333,   11),
  ('ascent.gold',     'ascent',   'Gold: Okay, Respect',            '6 666 totala reps',                      '🥇', 6666,   12),
  ('ascent.platinum', 'ascent',   'Platinum: Absolutely Cooked',    '10 000 totala reps',                     '💎', 10000,  13),
  ('ascent.mythic',   'ascent',   'Mythic: Who Even Are You',       '20 000 totala reps',                     '🐉', 20000,  14),
  ('comp.plot_twist', 'comp',     'The Plot Twist',                 'Bottenhalvan i halvtid → topp 3 i mål',  '🎬', NULL,   15),
  ('comp.three_week_tyrant', 'comp', 'Three-Week Tyrant',           'Topp 3 i din grupp, tre veckor i rad',   '👑', NULL,   16),
  ('comp.throne',     'comp',     'Take the Throne',                'Etta i din grupp när utmaningen slutar', '🏰', NULL,   17),
  ('troll.1',         'troll',    'Lazy Sloth',                     'Exakt 1 rep på en dag',                  '🦥', NULL,   18),
  ('troll.2',         'troll',    'Now You''re Just Messing With Me', 'Exakt 2 reps på en dag',               '😤', NULL,   19),
  ('troll.3',         'troll',    'That''s How It''s Gonna Be, Huh?!', 'Exakt 3 reps på en dag',              '😠', NULL,   20),
  ('troll.42',        'troll',    'The Answer to Everything',       'Exakt 42 reps på en dag',                '🎰', NULL,   21),
  ('troll.666',       'troll',    'Imp',                            'Exakt 666 reps på en dag',               '😈', NULL,   22),
  ('xp.100',          'special',  'Baby XP',                        '100 XP i utmaningen',                    '⭐', NULL,   23),
  ('day.combo',       'special',  'Rolling Thunder',                '3 dagar i rad med ökande reps',          '🌪️', NULL,  24),
  ('date.dec24',      'special',  'Santa''s Rep List',              'Logga en dag den 24 december',           '🎅', NULL,   25),
  ('day.monster',     'special',  'Monster Day',                    '250+ reps på en enda dag',               '🌋', NULL,   26);
```

> The catalog is the single source of truth for the UI (emoji, name, hint, family, order) —
> the client fetches it once, no hard-coded badge list in components.

---

## 4. Phase 2 — Engine (`src/achievements.ts`, new file)

Pure module, no Supabase imports. Mirrors the report's `evaluate()` plus progress helpers.

```ts
export interface ChallengeState {
  challengeId: number;
  startKey: string;               // 'YYYY-MM-DD'
  endKey: string;
  todayKey: string;
  totalReps: number;              // Σ logs for THIS challenge
  earnedXp: number;               // calculateEarnedPoints(...)
  longestStreak: number;          // consecutive logged days (this challenge)
  daysMissed: number;             // unlogged days in [start, min(today, end)]
  windowComplete: boolean;        // endKey < todayKey
  dayTotals: Map<string, number>; // date -> final amount (1 row/day, existing model)
  risingDays: number;             // consecutive strictly-increasing days
  maxDay: number;                 // biggest single day
  chosenTier: number;             // Number.parseInt(chosen_tier) — existing pattern
  groupSize: number;              // participants in same tier (≥2 for comp badges)
  finalPlacement: number;         // rank by cumulative reps (at end, else current)
  midPlacement: number;           // rank at challenge midpoint
  top3WeekEnds: number;           // consecutive week-ends ranked top 3
}

export function evaluate(s: ChallengeState): Set<string> { /* as designed in report §7.2 */ }

/** Progress line for in-progress badges; null = no meaningful progress (hint only). */
export function progressFor(id: string, s: ChallengeState):
  | { current: number; target: number }
  | { text: string }      // free-form: 'Du är #4 i din grupp', '2 missade dagar'
  | null;
```

**Progress rules per badge type:**

| Badges | Progress line |
|---|---|
| `streak.N` | `longestStreak / N` (`12 / 14`) |
| `reps.X`, `ascent.*` | `totalReps / target` (`742 / 1 000`) |
| `xp.100` | `earnedXp / 100` |
| `day.monster` | `maxDay / 250` |
| `perfect.run` | free-form: `X missade dagar` (0 = done) |
| `comp.throne` / `comp.three_week_tyrant` | free-form: `Du är #N i din grupp` (group ≥ 2 only) |
| `comp.plot_twist` | free-form: `#N i halvtid` (only past midpoint) |
| `troll.*`, `date.dec24` | `null` — hint only (that's the joke) |

**Tests** (`src/achievements.test.ts`, following the existing `*.test.ts` pattern):
- one test per family (thresholds, streak boundaries, ascent volume milestones
  incl. tier-independence and exact boundaries, trolling exact-match incl. the
  "day ended at N" policy, combo, dec24 gate, comp guardrail groupSize < 2,
  windowComplete gating for end badges)
- `progressFor` boundaries (0, mid, full, null cases)

---

## 5. Phase 3 — Sync hook (`src/useAchievementSync.ts`, new file)

```ts
export function useAchievementSync(
  userId: string,
  challenge: Challenge | null,
  logs: LogRow[],                 // already loaded by Profile/Stats
  tierGroup: TierGroupData,       // already computed for the leaderboard
) {
  // returns: { owned: Set<string>, newlyUnlocked: Achievement[] }
}
```

- Builds `ChallengeState` from data the page **already fetches** (no new queries for own user)
- Runs `evaluate()`, diffs against `user_achievements` for (user, challenge)
- **Two paths:**
  - *Fast* (after each log in `Profile.tsx`): **idempotent upsert only**
    (`onConflict: 'user_id,challenge_id,achievement_id'`) — no delete, because it lacks
    tier-group data (deleting here would wrongly revoke competition badges).
  - *Full* (wall load, own **and** others' walls): upsert **and** a scoped **delete** of
    badges no longer satisfied — the wall mirrors current data. `challenge_logs` is never
    touched; only derived `user_achievements` rows are reconciled.
- `newlyUnlocked` is non-empty only for the *live action* path → that's what triggers confetti

---

## 6. Phase 4 — Celebration UI (`src/components/UnlockCelebration.tsx`, new file)

- `canvas-confetti` (new dep, ~5 kB) + a centered toast card: **emoji, name, Swedish hint**
  — the name IS the payload ("😤 Now You're Just Messing With Me" pops up = the laugh)
- Triggered only from the live-action path, one at a time (queue if 2 land at once)
- Auto-dismiss ~4 s; no re-celebration on reload (owned set is authoritative)
- No share button in v1 (the card is screenshot-able as-is)

---

## 7. Phase 5 — Profile page: sub-tabs in `Stats.tsx` (changed file)

`StatsContent` becomes a profile page with a sub-tab bar under the title:

```
 [Erik] 📊 Erik statistik
 ┌─────────────────────────────┐
 │  Statistik │ Priser 🏆      │   ← ?tab=stats (default) | ?tab=priser
 └─────────────────────────────┘
```

- Tab state: `useSearchParams()` → `?tab=priser` (deep-linkable, zero `App.tsx` changes,
  existing Leaderboard links keep working and land on Statistik)
- **Statistik tab:** the existing `StatsDashboard` — untouched
- **Priser tab:** new `<AchievementsWall userId challengeId owned state isOwn />`
  - Header: `14 av 26` + thin progress bar (completionism)
  - Grid (2–3 cols mobile → 4 desktop) grouped under family section headers, fixed order:
    *Streaker · Perfekt runda · Volym · Ascent · Tävlan · Trolling · Special*
  - `<BadgeCard>` 3 states:
    - ✅ **earned:** full color, emoji, name, `unlocked 3 nov`
    - 🔶 **in-progress:** full color, name, progress bar + line (`742 / 1 000`)
    - 🔒 **locked:** dimmed, emoji + name + hint
  - Other users: identical wall (RLS disabled → same query, just different `user_id`)

**New components:** `src/components/AchievementsWall.tsx`, `src/components/BadgeCard.tsx`

---

## 8. Phase 6 — Catch-up ("Nya priser!")

- Open **own** Priser tab with `seen_at IS NULL` rows → banner at top of the wall:
  **"🎉 Nya priser!"** listing the unseen badges
- Button **"Fira 🎉"** → replays confetti for each (sequentially) →
  `UPDATE user_achievements SET seen_at = NOW()` for the unseen set
- Closing/dismissing the banner also marks seen
- Other users' walls: no banner (irrelevant)

---

## 9. Edge cases & policies

| Case | Policy |
|---|---|
| Trolling "exactly N" | Day counts at its **final** total (upsert model). Log 1, then +40 → final 41 → no Sloth. Edit later to land exactly on N → badge grants (it's a game). |
| Badge revocation | The **wall reconciles** to current data: badges no longer earned are removed on the next wall load (fast path stays add-only — it lacks tier-group data). Max-over-history badges (streaks, combo, tyrant) are inherently sticky and never wrongly revoked. `challenge_logs` is never touched. |
| No active challenge | Wall shows "Ingen aktiv utmaning just nu." |
| Tier group < 2 | Comp badges: hint only, no progress, never grantable. |
| Santa's date | Constant `DEC_24 = '2026-12-24'` in `achievements.ts` (one-line change per year). |
| Tier parsing | `Number.parseInt(chosen_tier, 10)` — existing pattern in `profileUtils.ts`. |
| Challenge midpoint | `start + (end − start) / 2` (date math, local `YYYY-MM-DD` keys as the app already uses). |
| Week-end snapshots (Tyrant) | Last Sunday (or challenge end) of each ISO week inside the window; rank tier group by cumulative reps at that date; 3 consecutive top-3 week-ends = grant. |
| Multiple challenges | Wall = active challenge only. Past runs keep their wall (per-challenge PK). |
| Concurrent log + load | Idempotent upsert (`onConflict`) — duplicate grants are no-ops. |

---

## 10. Testing plan

- **Unit:** `achievements.test.ts` (engine + progress, per §4) — the bulk of correctness
- **Manual QA checklist:**
  - [ ] Log 1 rep → Lazy Sloth pops with confetti (live)
  - [ ] Log 2 more same day (final 3) → That's How It's Gonna Be, Huh?! (no Sloth re-pop)
  - [ ] Reload page → no celebration, badge in wall
  - [ ] Earn a badge, close app, reopen → "Nya priser!" banner → Fira → seen
  - [ ] Other user's wall via Leaderboard link → correct owned/locked states
  - [ ] Progress lines update live after logging
  - [ ] 0 badges + no logs → wall renders 26 locked cards, header "0 av 26"
  - [ ] Tier group of 1 → comp badges locked, no progress line
  - [ ] Switch sub-tab via `?tab=priser` URL directly → wall loads

---

## 11. File change list

| File | Change |
|---|---|
| `sql/achievements.sql` | **NEW** — tables + 26 seed rows (§3) |
| `src/achievements.ts` | **NEW** — catalog types, `ChallengeState`, `evaluate()`, `progressFor()` |
| `src/achievements.test.ts` | **NEW** — engine + progress tests |
| `src/useAchievementSync.ts` | **NEW** — diff + idempotent upsert + scoped revoke (two-path reconcile) hook |
| `src/components/AchievementsWall.tsx` | **NEW** — wall: header, progress bar, family groups, catch-up banner |
| `src/components/BadgeCard.tsx` | **NEW** — 3-state card (earned / in-progress / locked) |
| `src/components/UnlockCelebration.tsx` | **NEW** — confetti + toast |
| `src/Stats.tsx` | **CHANGED** — sub-tab bar (Statistik / Priser) wrapping existing `StatsDashboard` |
| `src/Profile.tsx` | **CHANGED** — call `useAchievementSync` after the two log handlers + on mount |
| `package.json` | **CHANGED** — add `canvas-confetti` |
| `src/App.tsx` | **UNCHANGED** (routes already exist) |
| `src/Leaderboard.tsx` | **UNCHANGED** (links already exist) |

---

## 12. Build order (milestones)

| M | Scope | Done when |
|---|---|---|
| **M1** | `sql/achievements.sql` + `src/achievements.ts` + tests | Engine green in CI, catalog seeded |
| **M2** | `useAchievementSync` + `UnlockCelebration` wired into `Profile.tsx` | Logging a rep can pop a badge with confetti |
| **M3** | Profile page sub-tabs + `AchievementsWall` + `BadgeCard` (own user) | `/stats?tab=priser` shows the 26-card wall with progress |
| **M4** | Other users' walls + catch-up banner (`seen_at`) | Full feature: anyone's wall + "Nya priser!" |

Each milestone is shippable and demonstrable on its own.

---

## 13. Out of scope (v1)

- Share/social buttons, badge icons on leaderboard rows (v2 social amplifiers)
- RLS hardening (separate app-wide task — current pattern is RLS disabled everywhere)
- Lifetime (cross-challenge) wall view — per-challenge walls only
- Push notifications for badges
