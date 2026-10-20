-- 18 nya badges (26 -> 44) + rename av troll.1.
-- Endast katalogändringar i public.achievements — inga schema- eller
-- RLS-ändringar. Källan för badgenas identitet är src/achievements.ts;
-- håll den här filen och sql/achievements.sql synkroniserade med den.
-- Säker att köra om (idempotent).

BEGIN;

-- 1. Nya badges
INSERT INTO public.achievements (id, family, title, hint, emoji, goal, sort_order) VALUES
  ('streak.const3',    'streak',  'Groundhog Day',                 'Exakt samma antal reps 3 dagar i rad',     '🦫',  NULL,    27),
  ('streak.const7',    'streak',  'The Consistency Paradox',       'Exakt samma antal reps 7 dagar i rad',     '🎲',  NULL,    28),
  ('volume.soreness',  'volume',  'Seven Days of Soreness',        'Minst 1 500 reps över 7 dagar i rad',      '🍖',  NULL,    29),
  ('day.quadfather',   'special', 'The Quadfather',                '1 000 reps på en enda dag',                '🦣',  NULL,    30),
  ('troll.404',        'troll',   '404: Legs Not Found',           'Exakt 404 reps på en dag',                 '🫠',  NULL,    31),
  ('troll.999',        'troll',   'Unfinished Business',           'Exakt 999 reps på en dag',                 '😮',  NULL,    32),
  ('troll.1337',       'troll',   'LEET squatter',                 'Exakt 1 337 reps på en dag',               '🥷',  NULL,    33),
  ('troll.6969',       'troll',   'Nice.',                         'Exakt 6 969 totala reps — stanna där den dagen!', '😏', NULL, 34),
  ('troll.depression', 'troll',   'The Great Squat Depression',    '3 dagar i rad med 0 loggade reps',         '🌧️',  NULL,    35),
  ('date.halloween',   'special', 'Nightmare on Squat Street',     'Logga en dag på Halloween',                '🎃',  NULL,    36),
  ('date.blackfriday', 'special', 'Black Friday Burn',             'Minst 250 reps på Black Friday',           '🛒',  NULL,    37),
  ('day.comeback',     'special', 'The Comeback Kid',              'Logga igen efter minst 7 dagar utan reps', '🔄',  NULL,    38),
  ('day.redemption',   'special', 'The Slacker''s Redemption',     'Minst 100 reps på en dag efter 3 nolldagar', '⚡', NULL, 39),
  ('goat.bronze',      'goat',    'GOAT',                          'Först i din grupp till 1 000 totala reps', '🐐',  1000,    40),
  ('goat.silver',      'goat',    'GOATer',                        'Först i din grupp till 3 333 totala reps', '🐐',  3333,    41),
  ('goat.gold',        'goat',    'GOATest',                       'Först i din grupp till 6 666 totala reps', '🐐',  6666,    42),
  ('goat.platinum',    'goat',    'GOATerer',                      'Först i din grupp till 10 000 totala reps', '🐐', 10000,   43),
  ('goat.mythic',      'goat',    'GOATedest',                     'Först i din grupp till 20 000 totala reps', '🐐', 20000,   44)
ON CONFLICT (id) DO NOTHING;

-- 2. Rename: troll.1 "Lazy Sloth" -> "One Small Step for Squatkind"
UPDATE public.achievements
SET title = 'One Small Step for Squatkind',
    hint = 'Logga exakt 1 squat under en dag.'
WHERE id = 'troll.1';

COMMIT;
