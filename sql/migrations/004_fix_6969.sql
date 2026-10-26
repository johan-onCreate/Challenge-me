-- ====================================================================
-- FIX: troll.6969 "Nice." — ny regel + retroaktiv beviljning.
--
-- BAKGRUND: badget beviljades bara medan den *aktuella* totalen var
-- exakt 6 969, och väggen rev det så fort fler reps loggades.
-- Resultat: ingen fick det. Ny regel (koden i src/achievements.ts):
-- badget beviljas när den ackumulerade totalen (dagssummor i
-- dagordning) landar exakt på 6 969 på någon dag — en gång uppnått
-- stannar priset (badgar tas aldrig ifrån).
--
-- Idempotent — säker att köra om. challenge_logs (kollfilerna)
-- röras aldrig; detta beviljar bara den härledda badgestatusen.
--
-- FÖRHANDSGRANSKNING (vill du se vem som ska få det först?):
--   SELECT r.user_id, r.challenge_id, MIN(r.logged_at) AS reached_on
--   FROM (
--     SELECT user_id, challenge_id, logged_at,
--            SUM(daily_sum) OVER (
--              PARTITION BY user_id, challenge_id
--              ORDER BY logged_at
--            ) AS running_total
--     FROM (
--       SELECT user_id, challenge_id, logged_at, SUM(amount) AS daily_sum
--       FROM public.challenge_logs
--       GROUP BY user_id, challenge_id, logged_at
--     ) daily
--   ) r
--   WHERE r.running_total = 6969
--   GROUP BY r.user_id, r.challenge_id
--   ORDER BY r.challenge_id, r.user_id;
-- ====================================================================

BEGIN;

-- 1. Hintsynk (speglar katalogn i src/achievements.ts)
UPDATE public.achievements
SET hint = 'Exakt 6 969 totala reps — landa precis på siffran!'
WHERE id = 'troll.6969';

-- 2. Retroaktiv beviljning: alla (användare, utmaningar) vars
--    ackumulerade total landade exakt på 6 969 på någon dag.
--    ON CONFLICT DO NOTHING gör att redan beviljade rader och
--    dubbletter (t.ex. nolldagar efter 6 969) blir no-ops.
INSERT INTO public.user_achievements (user_id, challenge_id, achievement_id, unlocked_at)
SELECT r.user_id,
       r.challenge_id,
       'troll.6969',
       NOW()
FROM (
  SELECT user_id,
         challenge_id,
         SUM(daily_sum) OVER (
           PARTITION BY user_id, challenge_id
           ORDER BY logged_at
         ) AS running_total
  FROM (
    SELECT user_id, challenge_id, logged_at, SUM(amount) AS daily_sum
    FROM public.challenge_logs
    GROUP BY user_id, challenge_id, logged_at
  ) daily
) r
WHERE r.running_total = 6969
ON CONFLICT (user_id, challenge_id, achievement_id) DO NOTHING;

COMMIT;
