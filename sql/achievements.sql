-- ====================================================================
-- ACHIEVEMENTS-SCHEMA (PRISER) — ENBART TILLÄGG, INGÄN ÄNDRINGAR
-- på befintliga tabeller. Säker att köra om (idempotent).
--
-- Källkod för badgenas identitet (titlar, hints, emojis, familjer,
-- ordning) är src/achievements.ts. Seed-radarna nedan speglar den
-- listan — håll dem synkroniserade.
-- ====================================================================

-- 1. TABELL: achievements (Katalog — 26 badgar, statisk)
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,              -- 'troll.666', 'streak.30', ...
  family TEXT NOT NULL,             -- 'streak'|'perfect'|'volume'|'ascent'|'comp'|'troll'|'special'
  title TEXT NOT NULL,              -- 'Imp'
  hint TEXT NOT NULL,               -- 'Exakt 666 reps på en dag'
  emoji TEXT NOT NULL,              -- '😈'
  goal INT,                         -- Endast ascent: 1000|3333|6666|10000|20000
  sort_order INT NOT NULL
);

-- 2. TABELL: user_achievements (En vägg PER UTMANING.
--    seen_at = NULL tills användaren sett priset på väggen.)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, challenge_id, achievement_id)
);

-- SÄKERHETSINSTÄLLNINGAR (samma mönster som övriga tabeller i appen)
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;

-- 3. SEED: 26 badgar (ON CONFLICT gör att filen kan köras om)
INSERT INTO public.achievements (id, family, title, hint, emoji, goal, sort_order) VALUES
  ('streak.7',             'streak',  'A Week… What a Week',                 '7 dagar i rad',                        '🔥',  NULL,    1),
  ('streak.14',            'streak',  'Two Weeks of Mild Insanity',          '14 dagar i rad',                       '🔥',  NULL,    2),
  ('streak.21',            'streak',  'Three Weeks, Zero Regrets (Lying)',   '21 dagar i rad',                       '🔥',  NULL,    3),
  ('streak.30',            'streak',  'One Month of Pure Madness',           '30 dagar i rad',                       '🌙',  NULL,    4),
  ('streak.60',            'streak',  'Two Months? Are You Okay?',           '60 dagar i rad',                       '🧟',  NULL,    5),
  ('perfect.run',          'perfect', 'The Human Metronome',                 'Ensam dag missad, start till mål',     '⏱️',  NULL,    6),
  ('reps.500',             'volume',  '500 and Counting',                    '500 totala reps',                      '💪',  NULL,    7),
  ('reps.1k',              'volume',  'The Reptile',                         '1 000 totala reps',                    '🦎',  NULL,    8),
  ('reps.5k',              'volume',  'The Dinosaur',                        '5 000 totala reps',                    '🦖',  NULL,    9),
  ('ascent.bronze',        'ascent',  'Bronze: You Showed Up',               '1 000 totala reps',                    '🥉',  1000,    10),
  ('ascent.silver',        'ascent',  'Silver: Decent, Honestly',            '3 333 totala reps',                    '🥈',  3333,    11),
  ('ascent.gold',          'ascent',  'Gold: Okay, Respect',                 '6 666 totala reps',                    '🥇',  6666,    12),
  ('ascent.platinum',      'ascent',  'Platinum: Absolutely Cooked',         '10 000 totala reps',                   '💎',  10000,   13),
  ('ascent.mythic',        'ascent',  'Mythic: Who Even Are You',            '20 000 totala reps',                   '🐉',  20000,   14),
  ('comp.plot_twist',      'comp',    'The Plot Twist',                      'Bottenhalvan i halvtid → topp 3 i mål','🎬',  NULL,    15),
  ('comp.three_week_tyrant','comp',   'Three-Week Tyrant',                   'Topp 3 i din grupp, tre veckor i rad', '👑',  NULL,    16),
  ('comp.throne',          'comp',    'Take the Throne',                     'Etta i din grupp när utmaningen slutar','🏰',  NULL,    17),
  ('troll.1',              'troll',   'Lazy Sloth',                          'Exakt 1 rep på en dag',                '🦥',  NULL,    18),
  ('troll.2',              'troll',   'Now You''re Just Messing With Me',    'Exakt 2 reps på en dag',               '😤',  NULL,    19),
  ('troll.3',              'troll',   'That''s How It''s Gonna Be, Huh?!',   'Exakt 3 reps på en dag',               '😠',  NULL,    20),
  ('troll.42',             'troll',   'The Answer to Everything',            'Exakt 42 reps på en dag',              '🎰',  NULL,    21),
  ('troll.666',            'troll',   'Imp',                                 'Exakt 666 reps på en dag',             '😈',  NULL,    22),
  ('xp.100',               'special', 'Baby XP',                             '100 XP i utmaningen',                  '⭐',  NULL,    23),
  ('day.combo',            'special', 'Rolling Thunder',                     '3 dagar i rad med ökande reps',        '🌪️', NULL,    24),
  ('date.dec24',           'special', 'Santa''s Rep List',                   'Logga en dag den 24 december',         '🎅',  NULL,    25),
  ('day.monster',          'special', 'Monster Day',                         '250+ reps på en enda dag',             '🌋',  NULL,    26)
ON CONFLICT (id) DO NOTHING;

-- 4. SYNC: ascent-hintarna ändrades (ren volym, oavsett nivå).
--    ON CONFLICT DO NOTHING ovan uppdaterar inte befintliga rader,
--    så dessa UPDATE:er håller katalogen i databasen i synk. Idempotenta.
UPDATE public.achievements SET hint = '1 000 totala reps'  WHERE id = 'ascent.bronze';
UPDATE public.achievements SET hint = '3 333 totala reps'  WHERE id = 'ascent.silver';
UPDATE public.achievements SET hint = '6 666 totala reps'  WHERE id = 'ascent.gold';
UPDATE public.achievements SET hint = '10 000 totala reps' WHERE id = 'ascent.platinum';
UPDATE public.achievements SET hint = '20 000 totala reps' WHERE id = 'ascent.mythic';
