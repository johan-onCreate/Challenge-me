# 🏆 Achievements v3 — "Make Me Laugh"

> **Scope:** achievements for **THIS challenge only** (a fresh badge wall per challenge — like a
> new season). **Tone:** goofy, funny, a little absurd — you should *laugh a little* when one
> pops up — but still worth striving for. **Size:** **26** — your 17 favorites + your 5 new
> ideas + 4 extensions of your trolling arc (Dinosaur, 42, 666, Monster Day). All reachable
> inside a single challenge run.
>
> v3 replaces v2. The boring ones are gone. The names are stupid on purpose. The metrics got a
> new member: **😂 Funny**.

---

## 0. Executive summary

- **26 achievements, one challenge, zero cross-challenge logic.** Every rule is evaluated on this
  challenge's logs, tiers, and tier-group leaderboard — all data the app already has.
- **The set is built from 7 families:** 📅 Streaks (5) · 🧘 Perfect run (1) · 💪 Volume (3) ·
  🪜 Ascent (5) · 🏟️ Competition (3) · 🐒 Trolling (5) · 🎁 Special (4).
- **The "Trolling family" is the secret weapon.** "Log *exactly* 1 rep" → **Lazy Sloth**. The app
  roasts you *and* rewards you for your worst days. That's the "laugh when you receive it" core.
- **Streaks are the motivational spine** (7 → 14 → 21 → 30 → 60, escalating disbelief in the names).
- **Ascent is pure volume, tier-independent** (🥉 1,000 → 🥈 3,333 → 🥇 6,666 → 💎 10,000 →
  🐉 20,000 total reps): milestones are milestones no matter which tier you picked — changing
  tier can never cost you a badge.
- **Personal Record is NOT an achievement** — it's a live stat on the Stats page (Section 5).
- **Metrics: 9 now** — Dopamine, **Funny (new)**, Retention, Motivation, Social, Ease, Fit,
  Novelty, Longevity — each with a crisp definition (Section 2).

---

## 1. What changed since v2 (and why)

| Change | Why |
|---|---|
| ❌ Cut all multi-challenge badges (Veteran 5, Legend 10, cross-challenge PR, 3-consecutive-challenges) | Scope = this challenge only. A fresh wall per challenge also means the "unreachable this challenge, reachable next one" problem disappears — the wall matches the run. |
| 📛 Renamed (almost) everything | The old names were museum plaques. New names are the joke *and* the description. |
| 😂 Added **Funny** as a scored metric | "Laugh a little when receiving" is now a first-class requirement, not a vibe. |
| 🐒 Added the **Trolling family** (exactly 1 / 2 / 3 / 42 / 666 reps) | Your 1/2/3 ideas were the best ideas in the whole project. Extended the arc: tiny → tiny → tiny → *42* → *666*. |
| 🎅 Added **Santa's Rep List** (log on Dec 24) | One-shot calendar badge. Peak "why does this app exist" energy. |
| 🏰 Added **Take the Throne** (finish #1 in your tier group) | Your "finish on top" idea. |
| 👑 **Triple Crown redefined** → **Three-Week Tyrant**: top 3 in your tier group for 3 consecutive weeks | Now fully inside one challenge. |
| 🔢 Rep ladder: **500 / 1,000 / 5,000** | 500 rung added (your call), 1K kept, 5K as the big one. |
| 📊 **PR demoted to a stat** | An achievement that unlocks at "1 rep" feels broken. A live PR number that keeps growing feels alive. (Section 5.) |
| ⚖️ New scoring weights | Funny now carries 15% — same weight as Dopamine and Retention. |

---

## 2. The scoring metrics (9) — defined properly

You asked what Ease / Fit / Social mean. Here they are, no hand-waving:

| # | Metric | What it measures (1 = bad, 10 = great) |
|---|---|---|
| D | 🎉 **Dopamine** | The "OHHH" when it unlocks. Size of the hit. |
| F | 😂 **Funny** | **NEW.** Does the name/description make you smirk? Would you screenshot it and send it to the group chat? |
| R | 🔁 **Retention** | Does it make you come back tomorrow? (Streaks score huge here.) |
| M | 🎯 **Motivation** | Does it make you *do more reps* to get it? |
| S | 📣 **Social** | **Bragging value.** Do you want to show this to a friend or see it on a leaderboard? "Lazy Sloth" scores decent because it's *funny* to share, not impressive to share. |
| E | 🛠️ **Ease** | **Inverse build cost.** 10 = a pure function over data you already load (no schema change). 1 = needs a new feature/table. |
| G | 🧩 **Fit** | **Data-model fit.** How cleanly the rule maps onto `challenge_logs` / `user_challenges` / `challenges.tiers` with zero edge-case pain. (E = "how much work", G = "how cleanly it maps".) |
| N | ✨ **Novelty** | Have people seen this in other apps? "Exactly 666 reps in a day" is basically nowhere. |
| L | 📅 **Longevity** | Does it stay fun for the whole (long) challenge, or is it a one-day sparkle? |

**Composite** = D 15% · F 15% · R 15% · M 10% · S 10% · E 15% · G 10% · N 5% · L 5%.

> Fun and ease now dominate the ranking — which is exactly the brief: *funny, reachable, shippable.*

---

## 3. The 26 achievements

Legend: **D F R M S E G N L** + **Score** = composite. All rules are evaluated **on this
challenge's data only.** "Day total" = the final logged amount for that day (the app already
stores one amount per day per challenge).

### 📅 STREAK FAMILY — "the motivational spine" (5)

Comedy rule: the names escalate in disbelief as the streak gets bigger.

| ID | Name | Rule | D | F | R | M | S | E | G | N | L | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `streak.7` | 🔥 **A Week… What a Week** | 7 consecutive logged days | 8 | 7 | 9 | 8 | 5 | 9 | 10 | 4 | 7 | **7.80** |
| `streak.14` | 🔥 **Two Weeks of Mild Insanity** | 14 consecutive logged days | 8 | 8 | 9 | 8 | 5 | 9 | 10 | 4 | 7 | **7.95** |
| `streak.21` | 🔥 **Three Weeks, Zero Regrets (Lying)** | 21 consecutive logged days | 9 | 8 | 9 | 9 | 6 | 9 | 10 | 4 | 8 | **8.35** |
| `streak.30` | 🌙 **One Month of Pure Madness** | 30 consecutive logged days | 9 | 8 | 10 | 9 | 7 | 8 | 10 | 5 | 9 | **8.55** |
| `streak.60` | 🧟 **Two Months? Are You Okay?** | 60 consecutive logged days | 10 | 9 | 10 | 9 | 8 | 8 | 10 | 6 | 10 | **9.05** |

> Reachability note: `streak.60` needs a challenge window of 60+ days — yours qualifies (that's
> why it's on the list). Streaks are counted on **this challenge's** logged days.

### 🧘 THE PERFECT RUN (1)

| ID | Name | Rule | D | F | R | M | S | E | G | N | L | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `perfect.run` | ⏱️ **The Human Metronome** | Not a single day missed — every day from start to finish | 10 | 8 | 9 | 10 | 7 | 8 | 9 | 6 | 9 | **8.60** |

> Fires **when the challenge ends** (you can only be a metronome once the whole song is over).
> Harder than any streak — it's the streak with no off-ramp.

### 💪 VOLUME FAMILY — "the coin counter" (3)

| ID | Name | Rule | D | F | R | M | S | E | G | N | L | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `reps.500` | 💪 **500 and Counting** | 500 total reps this challenge | 7 | 8 | 7 | 7 | 4 | 10 | 10 | 5 | 6 | **7.45** |
| `reps.1k` | 🦎 **The Reptile** | 1,000 total reps (rep-tile) | 8 | 8 | 7 | 8 | 5 | 10 | 10 | 5 | 8 | **7.90** |
| `reps.5k` | 🦖 **The Dinosaur** | 5,000 total reps | 9 | 9 | 8 | 9 | 6 | 10 | 10 | 6 | 9 | **8.65** |

> A little evolution arc: 500 → reptile → dinosaur. The names do the bragging for you.

### 🪜 ASCENT FAMILY — pure volume, tier-independent (5)

Each rung is a **total-reps milestone**: 1,000 → 3,333 → 6,666 → 10,000 → 20,000. Your chosen
tier is irrelevant — a 3,333-tier user with 1,500 reps has already earned 🥉 Bronze, and
changing tier can never cost a badge (the new rule is a strict superset of the old one, so
nothing earned under the old rule is lost).

| ID | Name | Rule | D | F | R | M | S | E | G | N | L | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ascent.bronze` | 🥉 **Bronze: You Showed Up** | 1,000 total reps | 7 | 6 | 7 | 7 | 4 | 9 | 10 | 4 | 7 | **7.00** |
| `ascent.silver` | 🥈 **Silver: Decent, Honestly** | 3,333 total reps | 7 | 7 | 7 | 8 | 4 | 9 | 10 | 5 | 7 | **7.30** |
| `ascent.gold` | 🥇 **Gold: Okay, Respect** | 6,666 total reps | 8 | 7 | 8 | 8 | 5 | 9 | 10 | 5 | 8 | **7.75** |
| `ascent.platinum` | 💎 **Platinum: Absolutely Cooked** | 10,000 total reps | 10 | 8 | 9 | 10 | 8 | 8 | 10 | 6 | 9 | **8.80** |
| `ascent.mythic` | 🐉 **Mythic: Who Even Are You** | 20,000 total reps | 10 | 9 | 9 | 10 | 9 | 8 | 9 | 9 | 10 | **9.15** |

### 🏟️ COMPETITION FAMILY — "your tier group is the arena" (3)

All judged **within your tier group** (the leaderboard already groups by tier). Guardrail: the
group needs **≥2 participants** so nobody beats themselves.

| ID | Name | Rule | D | F | R | M | S | E | G | N | L | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `comp.plot_twist` | 🎬 **The Plot Twist** | Bottom 50% of your group at the challenge midpoint → top 3 at the end | 10 | 9 | 8 | 9 | 9 | 7 | 7 | 8 | 8 | **8.40** |
| `comp.three_week_tyrant` | 👑 **Three-Week Tyrant** | Top 3 in your tier group at the end of 3 consecutive weeks | 9 | 7 | 8 | 9 | 8 | 8 | 8 | 7 | 8 | **8.05** |
| `comp.throne` | 🏰 **Take the Throne** | Place #1 in your tier group when the challenge ends | 10 | 8 | 8 | 10 | 9 | 8 | 9 | 6 | 8 | **8.60** |

> **Three-Week Tyrant** (your redefined Triple Crown): at each week-end inside the challenge,
> rank the tier group by cumulative reps; 3 consecutive week-ends in the top 3 = badge.
> **The Plot Twist** is the highest-drama badge in the set — the leaderboard chart is literally
> the evidence.

### 🐒 TROLLING FAMILY — "the app roasts your bad days" (5)

The rule for all of them: **your final day total is EXACTLY N reps.** (One amount per day is
already how `challenge_logs` works — zero new data.) These are anti-achievements: the app
celebrates your laziest moments with full confetti. That's the joke, and it's why they're
addictive — even a bad day gets a reward, so a bad day never feels like quitting.

| ID | Name | Rule | D | F | R | M | S | E | G | N | L | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `troll.1` | 🦥 **Lazy Sloth** | Exactly **1** rep on a day | 6 | 10 | 4 | 3 | 6 | 10 | 10 | 8 | 4 | **7.00** |
| `troll.2` | 😤 **Now You're Just Messing With Me** | Exactly **2** reps on a day | 6 | 10 | 4 | 3 | 6 | 10 | 10 | 8 | 4 | **7.00** |
| `troll.3` | 😠 **That's How It's Gonna Be, Huh?!** | Exactly **3** reps on a day | 7 | 10 | 5 | 4 | 7 | 10 | 10 | 9 | 5 | **7.60** |
| `troll.42` | 🎰 **The Answer to Everything** | Exactly **42** reps on a day | 8 | 10 | 5 | 6 | 7 | 10 | 10 | 9 | 6 | **8.00** |
| `troll.666` | 😈 **Imp** | Exactly **666** reps on a day | 10 | 10 | 7 | 9 | 9 | 10 | 10 | 10 | 8 | **9.25** |

> The arc: *1, 2, 3* (you're trolling the app) → *42* (easy flex, Hitchhiker's) → *666* (genuinely
> hard — that's a monster day — and the name sells it). **Imp is #1 in the whole ranking**
> because it's the only badge that is simultaneously hilarious AND impressive.

### 🎁 SPECIAL FAMILY — "the weird ones" (4)

| ID | Name | Rule | D | F | R | M | S | E | G | N | L | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `xp.100` | ⭐ **Baby XP** | Earn 100 XP this challenge | 6 | 6 | 6 | 6 | 4 | 10 | 10 | 3 | 5 | **6.60** |
| `day.combo` | 🌪️ **Rolling Thunder** | 3 consecutive days with strictly increasing reps | 9 | 7 | 6 | 8 | 5 | 9 | 10 | 7 | 6 | **7.60** |
| `date.dec24` | 🎅 **Santa's Rep List** | Log a workout on **December 24** | 8 | 9 | 5 | 5 | 8 | 9 | 9 | 9 | 5 | **7.55** |
| `day.monster` | 🌋 **Monster Day** | **250+ reps in a single day** | 10 | 8 | 7 | 10 | 8 | 10 | 10 | 8 | 7 | **8.80** |

> **Monster Day** is the *achievement-shaped* version of a personal record — a threshold, not a
> moving target (see Section 5). **Santa's Rep List** is one-shot and calendar-gated: only
> reachable if the challenge window includes Dec 24 — yours does (it's the point).

---

## 4. Full ranking — all 26 by composite

| Rank | Achievement | Family | Score |
|---|---|---|---|
| 1 | 😈 **Imp** (exactly 666) | Trolling | **9.25** |
| 2 | 🐉 **Mythic: Who Even Are You** | Ascent | **9.15** |
| 3 | 🧟 **Two Months? Are You Okay?** | Streak | **9.05** |
| 4 | 💎 **Platinum: Absolutely Cooked** | Ascent | **8.80** |
| 5 | 🌋 **Monster Day** (250+ in a day) | Special | **8.80** |
| 6 | 🦖 **The Dinosaur** (5,000) | Volume | **8.65** |
| 7 | ⏱️ **The Human Metronome** | Perfect run | **8.60** |
| 8 | 🏰 **Take the Throne** | Competition | **8.60** |
| 9 | 🌙 **One Month of Pure Madness** | Streak | **8.55** |
| 10 | 🎬 **The Plot Twist** | Competition | **8.40** |
| 11 | 🔥 **Three Weeks, Zero Regrets (Lying)** | Streak | **8.35** |
| 12 | 👑 **Three-Week Tyrant** | Competition | **8.05** |
| 13 | 🎰 **The Answer to Everything** (42) | Trolling | **8.00** |
| 14 | 🔥 **Two Weeks of Mild Insanity** | Streak | **7.95** |
| 15 | 🦎 **The Reptile** (1,000) | Volume | **7.90** |
| 16 | 🔥 **A Week… What a Week** | Streak | **7.80** |
| 17 | 🥇 **Gold: Okay, Respect** | Ascent | **7.75** |
| 18 | 😠 **That's How It's Gonna Be, Huh?!** (3) | Trolling | **7.60** |
| 19 | 🌪️ **Rolling Thunder** (combo ×3) | Special | **7.60** |
| 20 | 🎅 **Santa's Rep List** | Special | **7.55** |
| 21 | 💪 **500 and Counting** | Volume | **7.45** |
| 22 | 🥈 **Silver: Decent, Honestly** | Ascent | **7.30** |
| 23 | 🥉 **Bronze: You Showed Up** | Ascent | **7.00** |
| 24 | 🦥 **Lazy Sloth** (1) | Trolling | **7.00** |
| 25 | 😤 **Now You're Just Messing With Me** (2) | Trolling | **7.00** |
| 26 | ⭐ **Baby XP** (100 XP) | Special | **6.60** |

> Notice what the **Funny** metric did: the trolling family — lowest on motivation — now sits
> interwoven through the top half instead of dumping at the bottom. The ranking reflects the brief:
> *fun and reachability beat prestige.*

---

## 5. Personal Record — answered: it's a STAT, not an achievement

You nailed the problem: "PR" is a **moving target**. The first time you log 1 rep, your PR is 1.
Unlocking an achievement for that is meaningless (you felt it — "kind of feels off"). And a PR
that re-unlocks every time you beat it isn't an achievement, it's a spam notification.

**The fix — split the two jobs:**

| Job | Where | Why |
|---|---|---|
| **Show the record** | **Stats page, as a live stat**: `🔥 Best day: 87 reps — 3 nov` | It already exists in `statsUtils.ts` (`bestDay`). The joy of a PR is *watching the number grow*, not a one-time unlock. Put it front and center on the Stats page with the date. |
| **Reward a big day** | **Achievement: 🌋 Monster Day (250+ reps in one day)** | A *threshold* is a real milestone — it's hard enough to matter, and it can't trivially unlock at 1 rep. (Threshold is tunable; 250 ≈ "a day you'll definitely tell someone about.") |

So: **PR → Stats page stat (prominent, live-updating). Monster Day → the achievement version.**
Both keep the "my best day" dopamine; neither feels broken.

---

## 6. How the 26 behave across the goals (1,000 / 3,333 / 6,666 / 10,000 / 20,000)

| Family | Goal tier is… |
|---|---|
| 📅 Streaks / 🧘 Metronome / 💪 Volume / 🌪️ Combo / 🌋 Monster Day / ⭐ Baby XP / 🎅 Santa / 🐒 Trolling | **Ignored.** A 1,000-goal user and a 10,000-goal user play the exact same streak, volume, trolling and special games. |
| 🪜 Ascent | **Pure volume** — each rung is a total-reps milestone (1,000 → 3,333 → 6,666 → 10,000 → 20,000), completely tier-independent. |
| 🏟️ Competition | **Your lane** — judged inside your tier group, so every goal level has its own throne to take. |

**Reachability per starting goal (of 26):**

| Start at | Not goal-locked | Lifetime max |
|---|---|---|
| 🥉 1,000 | **26** ✅ | **26** ✅ |
| 🥈 3,333 | **26** ✅ | **26** ✅ |
| 🥇 6,666 | **26** ✅ | **26** ✅ |
| 💎 10,000 | **26** ✅ | **26** ✅ |

Because Ascent is now **pure volume** and everything else is tier-agnostic, **every player can
reach 26/26 from any starting tier** — nobody's wall has a "not for you" slot. The only "lock"
left is reps: higher rungs need more total reps, not a bigger goal.

---

## 7. Integration & storage — smooth, per-challenge, zero new infra

### 7.1 Schema (2 tables — now with a `challenge_id`)

```sql
CREATE TABLE IF NOT EXISTS public.achievements (
  id          TEXT PRIMARY KEY,            -- 'troll.666', 'streak.30', 'ascent.platinum'
  family      TEXT NOT NULL,               -- 'streak'|'volume'|'ascent'|'comp'|'troll'|'special'
  title       TEXT NOT NULL,               -- 'Imp'
  description TEXT NOT NULL,               -- 'Exactly 666 reps on a single day. No notes.'
  emoji       TEXT,
  goal        INT,                         -- ascent only: 1000|3333|6666|10000|20000
  sort_order  INT
);

-- One wall PER CHALLENGE (fresh wall each run = "new season").
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id   BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, challenge_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_achievements_own ON public.user_achievements
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

> Per-challenge PK = every new challenge starts with an empty, exciting wall. (If you'd rather
> keep a lifetime wall, drop `challenge_id` from the PK — the engine doesn't care.)

### 7.2 The engine — one pure function over data you already load

```ts
// Everything below comes from THIS challenge's rows (Profile/Leaderboard already fetch them).
export interface ChallengeState {
  totalReps: number;            // Σ challenge_logs.amount
  earnedXp: number;             // calculateEarnedPoints(...)
  longestStreak: number;        // calculateStreaks on this challenge's dates
  noMissSoFar: boolean;         // every day in [start, today] logged
  windowComplete: boolean;      // end_date has passed
  dayTotals: Map<string, number>; // date -> final amount (1 row per day, already the model)
  risingDays: number;           // consecutive strictly-increasing days
  maxDay: number;               // biggest single day
  chosenTier: number;           // numeric tier value
  // tier group (from the same leaderboard data Leaderboard.tsx builds):
  groupSize: number;
  finalPlacement: number;       // rank by cumulative reps at end
  midPlacement: number;         // rank at challenge midpoint
  top3WeekEnds: number;         // consecutive week-ends ranked top 3
}

const ASCENT: Record<number, string> = {
  1000: 'ascent.bronze', 3333: 'ascent.silver', 6666: 'ascent.gold',
  10000: 'ascent.platinum', 20000: 'ascent.mythic',
};

export function evaluate(s: ChallengeState): Set<string> {
  const out = new Set<string>();
  const ok = (id: string, cond: boolean) => { if (cond) out.add(id); };
  const hasDay = (n: number) => [...s.dayTotals.values()].includes(n); // final day total == n

  // 📅 STREAKS
  ok('streak.7',  s.longestStreak >= 7);
  ok('streak.14', s.longestStreak >= 14);
  ok('streak.21', s.longestStreak >= 21);
  ok('streak.30', s.longestStreak >= 30);
  ok('streak.60', s.longestStreak >= 60);
  ok('perfect.run', s.windowComplete && s.noMissSoFar);      // fires at the end

  // 💪 VOLUME
  ok('reps.500', s.totalReps >= 500);
  ok('reps.1k',  s.totalReps >= 1000);
  ok('reps.5k',  s.totalReps >= 5000);

  // 🪜 ASCENT (pure volume: each rung is a total-reps milestone, tier-independent)
  Object.entries(ASCENT).forEach(([g, id]) => { if (s.totalReps >= Number(g)) out.add(id); });

  // 🏟️ COMPETITION (tier group, ≥2 people)
  const real = s.groupSize >= 2;
  ok('comp.plot_twist',     real && s.midPlacement > s.groupSize / 2 && s.finalPlacement <= 3);
  ok('comp.three_week_tyrant', real && s.top3WeekEnds >= 3);
  ok('comp.throne',          real && s.windowComplete && s.finalPlacement === 1);

  // 🐒 TROLLING (final day total exactly N)
  ok('troll.1',   hasDay(1));
  ok('troll.2',   hasDay(2));
  ok('troll.3',   hasDay(3));
  ok('troll.42',  hasDay(42));
  ok('troll.666', hasDay(666));

  // 🎁 SPECIAL
  ok('xp.100',    s.earnedXp >= 100);
  ok('day.combo', s.risingDays >= 3);
  ok('date.dec24', s.dayTotals.has('2026-12-24'));
  ok('day.monster', s.maxDay >= 50);

  return out;
}
```

### 7.3 Sync — two paths, idempotent, wall always reflects current data

There are **two sync paths**, and the difference is deliberate:

- **Fast path** (after each log, `Profile.tsx`) — **adds only, never deletes**. It builds
  state *without* tier-group data (`tierParticipants: []`), so it cannot judge competition
  badges; deleting here would wrongly revoke them.
- **Full path** (badge wall load, `AchievementsWall.tsx`) — **adds and deletes** (full
  reconcile). It has complete data including the tier group, so `evaluate()` is authoritative.

```ts
// Full path (wall): the wall mirrors the user's CURRENT data
async function reconcile(userId, challengeId, state) {
  const satisfied = evaluate(state);              // complete data, incl. tier group
  const owned    = await fetchOwned(userId, challengeId);
  const fresh    = [...satisfied].filter((id) => !owned.has(id));
  const stale    = owned.filter((id) => !satisfied.has(id));
  await upsert(fresh);                            // onConflict = PK (idempotent)
  await delete(stale);                            // scoped to this user + challenge
  celebrate(fresh);  // confetti + the badge's exact name in the toast
}
```

**Why delete is safe:** `evaluate()` is the single source of truth and is pure + fully
tested. Max-over-history metrics (`longestStreak`, `top3WeekEndStreak`, `risingDays`) only
*grow*, so a badge earned by a streak/combo/tyrant run is never wrongly revoked. Only
current-state metrics (total reps, single-day max, exact daily counts) revoke — and that is
exactly the correction case: log 1 000 by accident, edit down to 100 → the 1 000-rep badge
goes away. **`challenge_logs` (the real data) is never touched** — only the derived
`user_achievements` rows are reconciled.

**Triggers:** fast path after each log · full path on every wall load (own *and* others'
walls — the delete is scoped to the user being viewed).

**Why it's smooth:** no N+1 (one `evaluate()` over in-memory rows) · idempotent (PK +
`onConflict`) · celebration only for *new* unlocks · self-healing on load · a new badge = one
`ok(...)` line + one seed row · **trolling badges cost literally nothing** (one `includes(N)`).

> **Edge-case policy (trolling):** a day counts at its **final** total. Log 1 rep, then add 40
> more → final 41 → no Sloth, no Answer. The joke is "the day *ended* at exactly N."

---

## 8. Why the goofy design actually works (the theory, briefly)

1. **Laughter = memory = sharing.** A badge named *Now You're Just Messing With Me* gets
   screenshotted; a badge named *Centurion* gets ignored. The name is the viral unit.
2. **Rewarding bad days kills the all-or-nothing spiral.** Streak apps lose people when one bad
   day feels like total failure. The trolling family says: *even your laziest day has a prize.*
   You log 1 rep to "feed the Sloth" — the app turns guilt into a game.
3. **Escalation is the joke format.** Streak names get more panicked (7 → 60). Ascent names get
   more impressed. The volume badges evolve (reptile → dinosaur). Comedy needs a trajectory, not
   a thesaurus.
4. **Hard + funny > hard alone.** *Imp* (exactly 666) ranks #1 because it's the only badge that's
   genuinely difficult AND ridiculous. That's the target profile for the rest of the set.
5. **Names stay in English here; the UI can show a Swedish subtitle** under each (the app is
   Swedish — "Imp" gets a "666 exakta reps på en dag" caption and the joke travels fine).

---

## 9. Build waves

| Wave | Achievements | Notes |
|---|---|---|
| **W1** — the wall fills | A Week, Two Weeks, 500 and Counting, The Reptile, Baby XP, Bronze, Silver, Lazy Sloth, Messing With Me, That's How It's Gonna Be, Rolling Thunder | All trivial on existing data. By day 7 the wall has ~8–10 badges (trolling ones land fast — that's the point). |
| **W2** — the chase | Three Weeks (21), One Month (30), The Dinosaur, Gold, Three-Week Tyrant, The Plot Twist, The Answer (42), Take the Throne | Week-end snapshot logic for the Tyrant; midpoint snapshot for the Plot Twist. |
| **W3** — the grail | Two Months (60), Platinum, Monster Day (250+), The Human Metronome, Imp (666), Santa's Rep List, Mythic (20,000 grind) | End-of-challenge + long-streak + one-shot calendar + the big grinds. |

---

## 10. Iteration log (v1 → v3)

| # | Iteration | Outcome |
|---|---|---|
| 1 | (v1) 20 ideas, 8 metrics, "cut 4" | Solid, but generic fitness-app energy. |
| 2 | (v2) 3-axis tier design, per-goal debate, integration plan | Structurally right, tonally wrong — names were museum plaques. |
| 3 | (v3.1) Scope cut to **this challenge only**; per-challenge wall PK | Removed the "unreachable this challenge" class entirely. |
| 4 | (v3.2) **Funny metric added (15%)**; Ease/Fit/Social redefined with real definitions | "Laugh on receive" became a scored requirement. |
| 5 | (v3.3) **Trolling family** (1/2/3 → 42 → 666) + **Santa's Rep List** + **Take the Throne** + **Monster Day** | The set got a soul. Imp lands at #1. |
| 6 | (v3.4) **Full rename pass** — escalating streak names, evolution volume arc, roast-style Ascent | Names now carry the dopamine hit. |
| 7 | (v3.5) **PR demoted to Stats-page stat**; threshold version (Monster Day) as the achievement | Fixed the "unlock at 1 rep" flaw you spotted. |
| 8 | (v3.6) Final scoring of all 26 on 9 metrics, ranking, edge-case policy (final day total), build waves | Shippable. |
| 9 | (v3.7) Full score audit — recomputed every composite by hand; fixed 5 arithmetic errors (Imp 9.25, Mythic 9.15, Reptile 7.90, Silver 7.30, Santa 7.55); Baby XP added to ranking; set count corrected to 26 everywhere | Numbers now check out. |
| 10 | (v3.8) **Monster Day threshold 50 → 250+** (rescored 8.40 → 8.80, up to #5); **Mythic activated** — tier-independent volume badge (20,000 total reps, no 20k tier needed); reachability table updated; build wave W4 folded into W3 | Owner-approved set is final. |
| 11 | (v3.9) **Ascent simplified to pure volume** — all 5 rungs (1,000 → 20,000) are total-reps milestones, tier-independent; changing tier can never cost a badge (new rule is a strict superset of the old); hints updated ("N totala reps"); all rungs show live progress on the wall | Simpler engine, better UX, zero data impact. |
| 12 | (v4.0) **Wall reconciles to current data** — the badge wall now also *revokes* badges no longer earned (fast path stays add-only; it lacks tier-group data). Fixes the "logged 1 000 by accident, edited to 100, stuck with the badge" case. `challenge_logs` is never touched — only derived `user_achievements` rows are reconciled. Max-over-history badges (streaks, combo, tyrant) are inherently sticky and never wrongly revoked | The wall is now an honest, live view of what you've actually done. |

---

## 11. The 26 to implement (checklist)

**📅 Streaks (5):**
- [ ] 🔥 `streak.7` — A Week… What a Week
- [ ] 🔥 `streak.14` — Two Weeks of Mild Insanity
- [ ] 🔥 `streak.21` — Three Weeks, Zero Regrets (Lying)
- [ ] 🌙 `streak.30` — One Month of Pure Madness
- [ ] 🧟 `streak.60` — Two Months? Are You Okay?

**🧘 Perfect run (1):**
- [ ] ⏱️ `perfect.run` — The Human Metronome

**💪 Volume (3):**
- [ ] 💪 `reps.500` — 500 and Counting
- [ ] 🦎 `reps.1k` — The Reptile
- [ ] 🦖 `reps.5k` — The Dinosaur

**🪜 Ascent (5):**
- [ ] 🥉 `ascent.bronze` — You Showed Up (1,000)
- [ ] 🥈 `ascent.silver` — Decent, Honestly (3,333)
- [ ] 🥇 `ascent.gold` — Okay, Respect (6,666)
- [ ] 💎 `ascent.platinum` — Absolutely Cooked (10,000)
- [ ] 🐉 `ascent.mythic` — Who Even Are You (20,000 total reps)

**🏟️ Competition (3):**
- [ ] 🎬 `comp.plot_twist` — The Plot Twist
- [ ] 👑 `comp.three_week_tyrant` — Three-Week Tyrant
- [ ] 🏰 `comp.throne` — Take the Throne

**🐒 Trolling (5):**
- [ ] 🦥 `troll.1` — Lazy Sloth
- [ ] 😤 `troll.2` — Now You're Just Messing With Me
- [ ] 😠 `troll.3` — That's How It's Gonna Be, Huh?!
- [ ] 🎰 `troll.42` — The Answer to Everything
- [ ] 😈 `troll.666` — Imp

**🎁 Special (4):**
- [ ] ⭐ `xp.100` — Baby XP
- [ ] 🌪️ `day.combo` — Rolling Thunder
- [ ] 🎅 `date.dec24` — Santa's Rep List
- [ ] 🌋 `day.monster` — Monster Day

**Plus (not a badge):** 📊 PR as a live stat on the Stats page (`bestDay` already computes it).

---

## 12. TL;DR

- **26 badges, one challenge, fresh wall per run.** All your favorites kept (streak ladder,
  500/1K reps, Ascent, Comeback→**The Plot Twist**, Triple Crown→**Three-Week Tyrant**,
  no-miss→**The Human Metronome**, Combo→**Rolling Thunder**, 100 XP→**Baby XP**).
- **The fun comes from the Trolling family** (exactly 1/2/3/42/666) — the app roasts your bad
  days with full confetti. *Imp* (exactly 666) is the #1 badge: hard AND ridiculous.
- **PR is a stat, not a badge** — live "Best day" on the Stats page; **Monster Day (250+ in a
  day)** is the achievement-shaped version.
- **Metrics: 9** — added **😂 Funny (15%)**; Ease = inverse build cost, Fit = data-model fit,
  Social = bragging value (all defined in Section 2).
- **Integration:** 2 tables (+`challenge_id`), one pure `evaluate()` over data you already load,
  idempotent upsert, confetti only for new unlocks, and a wall that reconciles to current data
  (editing a log down removes badges you no longer earn — your logs are never touched).
  Trolling badges cost one `includes(N)` each.
- **Ascent is pure volume, tier-independent** — all 5 rungs (1,000 → 20,000) are total-reps
  milestones; changing tier can never cost a badge. One seed row per badge.
