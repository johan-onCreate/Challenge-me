# Progress: 18 nya badges + GOAT + fixar

Gren: `feat/new-achievements-and-fixes`
Status: **klar i koden** — kvar: köra migration 003 i Supabase + PR-review.

## Ändringar i korthet

### A. 18 nya badges (26 → 44) i `src/achievements.ts`

| id | Familj | Titel | Regel |
| --- | --- | --- | --- |
| `streak.const3` | streak | Groundhog Day | Exakt samma antal reps 3 dagar i rad |
| `streak.const7` | streak | The Consistency Paradox | Exakt samma antal reps 7 dagar i rad |
| `volume.soreness` | volume | Seven Days of Soreness | Minst 1 500 reps över 7 dagar i rad (rullande) |
| `day.quadfather` | special | The Quadfather | 1 000 reps på en enda dag |
| `troll.404` | troll | 404: Legs Not Found | Exakt 404 reps på en dag |
| `troll.999` | troll | Unfinished Business | Exakt 999 reps på en dag |
| `troll.1337` | troll | LEET squatter | Exakt 1 337 reps på en dag |
| `troll.6969` | troll | Nice. | Exakt 6 969 **totala** reps — stanna där den dagen! |
| `troll.depression` | troll | The Great Squat Depression | 3 raka nolldagar efter minst en loggad dag |
| `date.halloween` | special | Nightmare on Squat Street | Logga en dag på 31 oktober 2026 |
| `date.blackfriday` | special | Black Friday Burn | Minst 250 reps på 27 november 2026 |
| `day.comeback` | special | The Comeback Kid | Logga igen efter minst 7 raka nolldagar (kräver logg innan) |
| `day.redemption` | special | The Slacker's Redemption | Minst 100 reps på en dag efter 3 raka nolldagar (kräver logg innan) |
| `goat.bronze` | goat | GOAT | Först i gruppen till 1 000 |
| `goat.silver` | goat | GOATer | Först i gruppen till 3 333 |
| `goat.gold` | goat | GOATest | Först i gruppen till 6 666 |
| `goat.platinum` | goat | GOATerer | Först i gruppen till 10 000 |
| `goat.mythic` | goat | GOATedest | Först i gruppen till 20 000 |

Nye ren hjälpfunktioner (rena, testade): `longestConstantRun`,
`maxRollingWindowTotal`, `longestZeroRunAfterLog`, `hasReturnAfterGap`,
`firstToReachGoal`. Nya state-fält: `userId`, `constantDays`, `weekTotal`,
`maxZeroRun`, `goatWinner`.

### B. GOAT-mekanism (ingen ny databastabell)

- `firstToReachGoal(participants, goal)`: tidigaste dag då någon passerar
  målet vinner; samma-dag-avgörande = minsta userId (deterministiskt;
  väggen har bara dagssummor, inga tidsstämplar).
- `buildChallengeState` beräknar `goatWinner` (kräver grupp ≥ 2 + tier med
  GOAT-badge). Snabbspåret i profil (`tierParticipants: []`) ger `null` —
  GOAT beviljas bara på prisväggen, som tävlingsbadgarna.
- `evaluate()` beviljar GOAT-badget bara om `goatWinner === userId` och
  badge-mål === användarens `chosenTier` → exakt en mottagare per nivå.
- Progress: bara ditt egna tier-mål visar progressrad; övriga GOAT-badges
  förblir låsta.

### C. Rename

`troll.1`: "Lazy Sloth" → **"One Small Step for Squatkind"**,
hint → "Logga exakt 1 squat under en dag."

### D. Fix: Prisväggen saknade ägarnamn

`Stats.tsx` spara `ownerName` (alias/fullt namn, null = själv) och skicka
`ownerLabel` till `AchievementsWall`. Rubriken blir **"Mina priser 🏆"**
(själv) eller t.ex. **"Tobbe priser 🏆"** (annan).

### E. Fix: "Din totala poäng" följde inte temat

`Profile.tsx`: hårkodat `slate/amber`-gradbyte bytts mot tematokens
(`bg-raised`, `border-outline-soft`, `text-content-faint`, `text-content`,
`text-warning` för "XP"). Fungerar i alla tre teman (ljus/mörk/rosa).

### F. SQL

- `sql/migrations/003_new_achievements.sql` (ny, idempotent): 18 INSERT
  ON CONFLICT DO NOTHING + UPDATE för renamen av `troll.1`.
  **Måste köras i Supabase SQL Editor.**
- `sql/achievements.sql` (seed) uppdaterad att spegla katalogen (44 rader +
  sync-UPDATE för renamen).

### G. Tests

- `achievements.test.ts`: katalog 26 → 44, nya helper-tester, nya
  evaluate-tester per badge, `buildChallengeState`-test (inkl. goatWinner),
  progressFor-tester, 172 test totalt.
- `AchievementsWall.test.tsx`: 44 badges, GOAT-huvud, nytt rename-namn.
- `BadgeCard.test.tsx` + `UnlockCelebration.test.tsx`: uppdaterade till
  nytt namn/hint.
- Stavning: "nolldagar" (två L) i hint och alla kommentarer.

## Checklist

- [x] Badgemotor: 18 nya badges + goat-familj + renamen
- [x] GOAT-mekanism (firstToReachGoal, goatWinner, evaluate, progress)
- [x] Nya hjälpfunktioner + tester
- [x] `buildChallengeState`-nya fält + tester
- [x] SQL-migration 003 + seed-sync
- [x] Väggens rubrik (ownerLabel)
- [x] Profilen XP-box tema
- [x] Tests uppdaterade (172 passerar)
- [x] `npm run lint` (0 fel) + `npm run build` (OK)
- [x] Review genomgång 1
- [x] Review genomgång 2
- [x] Lokal körning verifierad + testinstruktioner
- [x] Commit + draft PR

## Review genomgångar

### Genomgång 1 (motor + integrationspunkter)

- Katalog: 44 unika badges, sortOrder 1..44 utan luckor. ✓
- Hjälpfunktioner re-värda: `longestConstantRun`, `maxRollingWindowTotal`,
  `longestZeroRunAfterLog`, `hasReturnAfterGap`, `firstToReachGoal`. ✓
- Väggen (`loadWallData`) inkluderar den visade användaren i `participants`
  → GOAT-gruppen blir rätt och `goatWinner` kan matcha ägaren. ✓
- `evaluate()`: alla nya regler beviljas korrekt; GOAT kräver grupp ≥ 2,
  `goatWinner === userId` och badge-mål === `chosenTier`. ✓
- `progressFor`: quadfather (x/1000), soreness (x/1500), eget GOAT-mål;
  övriga nya badges → null (hint räcker). ✓
- Profilens tematokens (`bg-raised`, `border-outline-soft`,
  `text-content-faint`, `text-content`, `text-warning`) finns i
  `index.css` för alla tre teman. ✓
- Stavning: "nolldagar" (två L) i hint och alla kommentarer. ✓

### Genomgång 2 (detaljer + polish)

- Uppdaterat föråldrad kommentar i `progressFor` (default-fallet).
- Väggens rubrik: böjd nu i genitiv på andras vägar — "Tobbe:s priser 🏆"
  (namn som slutar på s: "Johanssons priser 🏆"), egna vägen "Mina priser 🏆".
- Testsvit, lint och build köra igen efter ändringarna:
  **172 test/gröna, 0 lint-fel, build OK.**

## Lokal körning — verifierad

- `npm run dev` startar och serverar `http://localhost:5173/` (HTTP 200).
- `.env` finns med `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_APP_URL`.

## Så testar du själv

1. **Kör migrationen** (en gång): klistra in
   `sql/migrations/003_new_achievements.sql` i Supabases SQL Editor och kör.
   Idempotent — säker att köra om. Utan den finns de nya badge-id:na inte i
   databasen och lås av nya badges kan misslyckas (foreign key).
2. **Starta appen**: `npm run dev` → öppna http://localhost:5173/
3. **Prisväggen**: fanan "Priser" ska visa rubriken **"Mina priser 🏆"** med
   44 badges, varav en ny sektion **GOAT** (5 🐐-badges).
4. **Andras vägar**: öppna en annan squatters profil → Priserna ska få
   rubriken **"{namn}:s priser 🏆"** (alias om alias finns, annars fullt namn).
5. **Tema**: byt till rosa (eller ljus/mörkt) tema → "Din totala poäng"-boxen
   på profilen ska följa temat (ingen grå/svart box längre).
6. **Snabbtest av nya badges** (logga i appen):
   - Exakt 1 squat → "One Small Step for Squatkind" 🦥
   - Exakt 404 / 999 / 1 337 på en dag → respektive troll-badge
   - 1 000 på en dag → The Quadfather (och Monster Day)
   - Samma antal 3 dagar i rad → Groundhog Day
   - 3 dagar utan logg (efter loggade dagar) → The Great Squat Depression
   - 7 dagar utan, logga igen → The Comeback Kid
   - 3 dagar utan, sedan 100+ → The Slacker's Redemption
   - 1 500+ reps över en rullande vecka → Seven Days of Soreness
   - Logga en dag 31/10 (Halloween) → Nightmare on Squat Street
   - 250+ på 27/11 (Black Friday) → Black Friday Burn
   - GOAT: kräver minst 2 i samma tier — först ut till tier-målet får 🐐
   - "Nice." kräver exakt 6 969 **totala** — loggar du fler försvinner det
     (badget återfinns om du hamnar på exakt 6 969 igen, via väggen).

## Saker att köra manuellt

1. `sql/migrations/003_new_achievements.sql` i Supabase SQL Editor.
2. Godkänn PR:en när den ser bra ut (skapad som draft).
