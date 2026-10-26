# Säsongsdesign (Halloween + Christmas) – Plan, beslut & progress

_Dokumentet följer arbetet: idéer → beslut → iterationer → resultat. Uppdateras löpande._

## 1. Mål

- **Halloween** som admin-toggla säsongsdesign som:
  - Ser proffsigt ut (mörk "night scene", inte bara emoji som svävar)
  - Har **rörelse**: flygande, fallande, svävande, glödande, tåke-drifft
  - Byter **bakgrund till mörkare** nattton (alla tre färgtemana: ljust/mörkt/rosa)
  - Fungerar på **alla aspect ratio**, mobil, zoomad desktop
  - Spelar en **spök-ljud** när man loggar squats (fungerar i mobilbrowsers)
- **Christmas** som andra säsong i samma system (efter att Halloween är godkänt)
- Systemet ska vara **lätt att utöka** (Black Friday m.fl. senare)

## 2. Säkerhets- & miljöbegränsningar (viktiga!)

| Regel | Hur vi håller den |
|---|---|
| **Inga nya npm-paket / ingen `npm install`** | Allt är CSS + emoji + Web Audio API (inbyggd i browsersn) |
| **Inga nedladdade tillgångar** (ljudfiler, bilder, fonts) | Ljudet **syntetiseras i kod** med oscillatorer; visualer är emoji + CSS-gradienter |
| **Inget farligt externt** | Endast read-only websök för inspiration. Inget körs externt |
| Inga nya devDependencies | Testas med befintlig vitest + `renderToString` (node) |
| **⚠️ Ladda INTE bilder/skärmdumpar in i sessionen** | Browser-QA görs enbart med **textbaserade kontroller**: `browser.evaluate` (DOM, computed styles, räknande av dekor-objekt), `browser.console`, `browser.find`. `browser.screenshot` används **aldrig** – den föregående sessionen dog när den försökte ladda in en skärmdump som bild. |

## 3. Inspiration (från websök, 2026-10-24)

Från kända "Halloween Effects"-lösningar (WordPress/Framer/Wix-plug-ins) och
pure-CSS halloween-scener:

1. **Lager av drivande tåka** – blurade, halvtransparenta gradienter som drifter
   åt olika håll i olika takt. Det billigaste sättet att få "cinematic" känsla.
2. **Båtarna flyger IN från utanför viewporten, sveper över och ut igen** –
   inte cirkelrörelse. (Vi har detta redan, behålls.)
3. **Fallande löv** (höst) med rotation + drift, låg opacitet.
4. **Blinkande/flimmer** – subtil opacitetspuls på glödande objekt.
5. **Battery-friendly**: animationer **pausas när tabben är dold**
   (`visibilitychange` + `animation-play-state: paused`). Proffsställning vi adopterar.
6. **Reduced-motion-stöd** (behålls från v1).
7. **Nattpalett som ersätter hela appens variabler** – snarare än en overlay
   blir appen "i nattläge" med säsongens accent (orange/pumpa).

## 4. Arkitektur

```
Admin-panel (Säsongsdesign: Ingen / Halloween 🎃 / Christmas 🎄)
        │  uppdaterar
        ▼
public.site_settings (1 rad, seasonal_theme TEXT)      ← SQL 004 + 005
        │  fetchas (mount + 60 s polling)
        ▼
App.tsx: state seasonalTheme
        ├── document.documentElement.setAttribute("data-season", …)   (CSS-palett)
        ├── <SeasonalDecor theme>  (tåka, vignett, emoji-cast, per säsong)
        └── prop till Profile → ljud vid squash-logg (endast när säsong aktiv)
```

- **Palett**: `:root[data-season="halloween"] { --surface: …; --accent: …; }` i
  `index.css` – samma mönster som befintliga `data-theme`. `body` har redan
  `background-color: var(--surface)` → byter automatiskt. Nattgradienten läggs
  på `body` (målars bakom ALLT – inga z-index-trick).
- **Decor**: `SeasonalDecor.tsx` är config-driven (`DECOR_CONFIGS` per säsong).
  Varje item: emoji, position, storlek, `motion`-typ, delay, duration,
  `wideOnly` (dold under `lg`), ev. trådlängd.
- **Ljud**: `seasonalSound.ts` – en delad `AudioContext` skapas/resumeras
  **synkront i klick-handlaren** (krav för iOS Safari), låten syntetiseras
  efter lyckad logg. `playSeasonalSound(theme)` växlar per säsong.

## 5. Designbeslut + övervägda alternativ

| # | Beslut | Alternativ (avvisat) | Varför |
|---|---|---|---|
| D1 | Nattgradient på `body` + palett-overrides via `data-season` på `:root` | Halvtransparent mörk overlay ovanför allt | Overlay mörkar även korten/texten och kräver z-index-juggling. Palett-bytet gör att kort, text och accent alla ser "naturomma" och proffsiga ut. Användarens färgtema respekteras när säsongen är av. |
| D2 | Accent → orange (halloween) / röd (christmas) via variabler | Behålla blå accent | "Appen blir halloween" – knappar, länkar, rubriker i säsongsfärg. Störst effekt per rad CSS. |
| D3 | Ljud = Web Audio API-syntes (inga filer) | MP3/WAV-fil | Ingen nedladdning, ingen stor fil, fungerar offline, mobilvänligt. Kvaliteten på ett kort "spök-vissling" är fullt tillräcklig. |
| D4 | `AudioContext` värms upp **i klicket** (synkront), lånet spelas efter `await` | Skapa context först vid ljud | iOS Safari kräver gesture-aktivering; transient activation (~5 s) klarar en nätverks-rondtrip om contexten redan är resumed. |
| D5 | Ljudendast vid **lyckad** logg (efter `!error`) | Ljud vid klick oavsett | Belönande feedback kopplad till händelsen; undviker "ljud men inget hände". |
| D6 | `wideOnly`-split (narrow viewport → bara hörnobjekt + fallande löv) | Minskad storlek istället | På mobil ligger "skärmkanten" ovanför innehållet – rörliga objekt blockerar text. (Lärs av v1.) |
| D7 | Tåka + vignett som egen lager i decor-roten | Inget | Billigaste vägen till djup/atmosfär. Låg opacitet, `pointer-events-none`. |
| D8 | `animation-play-state: paused` vid dold tab | Lämna som | Battery-friendly (proffsmässigt), 5 rader kod. |
| D9 | Negativa `animation-delay` (t.ex. `-6s`) | Endast positiva | Sprider objekten över cykeln direkt vid laddning – ingen "tom start". |
| D10 | Fladdermöss: inre `scaleY`-flap-lager utanför fly-keyframes | Enbart translation | Vinge-känsla. Två transform-lager (yttre flyg, inre flapp) bryter inte varandra. |
| D11 | Pumpkin-glöd-färg som CSS-variabel `--decor-glow` | Orange hårdkodad | Christmas-trädet får grön glöd i samma keyframes. |
| D12 | Christmas = ny palett (nattblå) + ny DECOR-config + jangeljude-ljud | Dela halloween-palett | Egen karaktär; systemet bevisar att utökning är 4–5 små steg. |
| D13 | SQL: ny migration 005 som ersätter CHECK-constrainten | Ändra 004 | 004 kan redan vara körd i Supabase; migrationer ska vara additiva. |

## 6. Halloween-scen (slutbild)

- **Bakgrund**: djup lila natt med månljus-radial högt upp + pumpa-orange
  glöd ner till höger; `background-attachment: fixed` (desktop).
- **Tåka**: 2 blurade lila lager nära botten, drifter mot varandra (26 s / 34 s).
- **Vignett**: subtil mörkning i kanterna (cinematic).
- **Cast (broad, ≥1024 px)**: 3 fladdermöss (flyg + vinge-flap, 75 % opacitet),
  2 spöken som svävar med fade, 1 stort spöke som "häntar" tvärs över (38 s,
  50 %), 2 spindlar på trådar, godis.
- **Cast (alla storlekar)**: 2 hörnvevor, stor måne med glöd (topp-höger),
  2 glödande pumpor (bottenhörn), **4 fallande höstlöv** (låg opacitet, roterar).
- **Ljud** vid squash-logg: spök-vissling – descending sinus 520→140 Hz med
  vibrato (7 Hz LFO), lowpass, 0,7 s, låg volym (peak ~0,18).

## 7. Christmas-scen (slutbild)

- **Bakgrund**: djup vinterblå natt + sval aurora-radial + varm glöd nerifrån.
- **Palett**: accent rött, accent-2 grönt.
- **Cast (alla storlekar)**: 6 fallande snöflingor ❄️ (drift + rotation,
  varierande takt), 2 granar 🎄 i bottenhörnen med **grön glöd** (`--decor-glow`),
  snöman ⛄, glittrande ✨.
- **Cast (broad)**: 3 snöflingor större + fallande, tomteslände 🎅 som flyger
  tvärs över (slow `fly`), klocka 🔔 som svävar, granljus-ljusfläcka? (ej – håll det enkelt).
- **Ljud** vid squash-logg: "jingle" – två höga triangle-pings (G6 → C7) med
  snabb exponentiell decay, 0,5 s.

## 8. Iterationsplan (checklista)

- [x] 0. v1: emoji-cast v1 (flyg/hovra/svinga/glöd), admin-toggle, DB
- [x] 1. v2: responsiv `wideOnly`-split (mobilproblem)
- [x] 2. **Dokument** (detta) – plan + beslut
- [x] 3. **Iter A – Natt & atmosfär**: `data-season`-palett (halloween), body-gradient, tåka, vignett, måne-glöd
- [x] 4. **Iter B – Mer liv**: fallande löv, vinge-flap, negativa delays, visibility-pause, `--decor-glow`
- [x] 5. **Iter C – Ljud**: `seasonalSound.ts`, koppling i Profile (båda loggvägarna), test
- [ ] 6. **Iter D – QA i browser** (textbaserad!): desktop + mobil-viewport via `browser.evaluate`, **inga skärmdumpar**, fixa
- [x] 7. **Iter E – Christmas**: palett, DECOR-config, ljud, SQL 005, admin-val
- [ ] 8. **Iter F – Slut-QA**: alla test, build, dokument kompletteras, commit, sammanfattning

## 10. V2 – Säsongerna som egna färgteman (2026-10-24)

### 10.1 Mål

- **Halloween 🎃 och Christmas 🎄 blir vanliga färgteman** – fjärde och femte
  alternativet i temaväxjaren, **fritt valbara av alla användare** (även
  inloggade). Ingen admin-funktion längre.
- Snygga **pumpa/gran-knappar** i temaväxjaren.
- Samma scen, ljud och atmosfär som V1 – bara aktiveringsvägen byts ut.
- Per-enhet: valet sparas i **localStorage** (samma mönster som ljust/mörkt/rosa).
- `site_settings`-tabellen (admin-togglen) fanns bara i den lokala DB:en under utvecklingen – inget att radera i production.

### 10.2 Arkitektur (V2)

```
ThemeSwitcher (5 knappar: ljust / mörkt / rosa / 🎃 / 🎄)
        │  klick → setTheme() (localStorage + data-theme på <html>)
        ▼
App.tsx: theme-state (lyft från ThemeSwitcher)
        ├── index.css: [data-theme="halloween"] / [data-theme="christmas"]
        │     (palett + nattgradient – samma CSS som V1, annan selector)
        ├── <SeasonalDecor theme>  (samma komponent, drivs av theme)
        └── prop till Profile → ljud vid squash-logg när säsongstema aktivt
```

Skillnad mot V1: **en enda källa** (`data-theme`) istället för `data-theme` +
`data-season`. Ingen DB, ingen polling, ingen admin.

### 10.3 Beslut (V2)

| # | Beslut | Alternativ (avvisat) | Varför |
|---|---|---|---|
| V2-D1 | Säsongs-paletterna flyttas från `[data-season]` till `[data-theme]` | Behålla båda attributen | En attribut = en källa. `data-theme` sätts redan vid startup; ingen dubbel state. |
| V2-D2 | Theme-state **lyfts till App** (ThemeSwitcher blir controlled) | Lämna state i ThemeSwitcher, läs DOM-attributet | SeasonalDecor + Profile (ljud) behöver samma state. React-idiomatiskt, inget DOM-lyssnande. |
| V2-D3 | Admin-funktionen raderas: `AdminSeasonalTheme.tsx`, `seasonalTheme.ts` (DB-fetch/set), SQL-tabellen | Behålla tabellen "före framtiden" | Död kod + en tabell som bara fanns i den lokala DB:en (inget i production att dropa). |
| V2-D4 | 🎃/🎄 som **emoji-knappar** i växjaren | Egna SVG-ikoner | Appen använder redan emoji i navigationen ("Statistik 📊", "Topplista 🏆"). Emoji = noll tillgångar, matchar stil, ser ut. |
| V2-D5 | Ljudet spelas fortfarande vid **lyckad logg** när ett säsongstema är aktivt | Ljud vid temaväxling | Belöningsljud kopplat till händelsen (samma som V1, D5). |
| V2-D6 | Persistens: **localStorage per enhet** (samma som övriga teman) | Delat i DB | Teman är personliga. Behöver ingen backend, fungerar offline, ingen latency. |
| V2-D7 | `SeasonalDecor` tar `ThemeName` (inga config → renderar null) | Ny `SeasonalTheme`-typ kvar | Typen `SeasonalTheme` försvinner med `seasonalTheme.ts`. En typ för tema = enklare. |

### 10.4 Christmas-extras: ljud + snö (2026-10-24)

**Beslut (valda av användaren efter research):**

| # | Beslut | Källa & licens | Tillit |
|---|--------|----------------|--------|
| S1 | **Båda säsongerna spelar klippfiler** vid logg: Halloween = **ulvsskrik** (`public/wolf-howl.mp3`), Christmas = **"Jingle Bells"** (`public/jingle-bells.mp3`, Pixabay #439615, DRAGON-STUDIO – Pixabay Content License, ingen attribution krävs). Buffern cachas per fil. Syntes-ljuden (spök-vissling/pings) är borta. | Jingle Bells: Pixabay ✅. Ulvsskrik: filen tillhandahållen av användaren – **licens ej verifierad** | ✅ Pixabay, etablerad plattform (2010) |
| S2 | ~~Snö på komponentkanter (CSS "snow caps")~~ – **TAGET BORT** efter användarfeedback ("ser ful ut"). | – | – |
| S3 | **Helskärms snöfall = täta emoji-snödrar** (44 flingor: ❄️ ❅ ❆ i tre djuplager, ren CSS). **Snö-videon togs bort** (grönskärm + canvas chroma key var resurskrävande) – de täta snöflingorna ersatte den helt. | Inga externa tillgångar – ren CSS + emoji | ✅ Inga licensfrågor |

**Viktiga noteringar:**
- **Inga automatiska nedladdningar** – användaren laddar ner filerna själv:
  - Ljud → `public/jingle-bells.mp3`
- Ljudet fetchas + decodas **en gång** och buffern cachas i `seasonalSound.ts`
  (spelas via delad AudioContext – `warmUpAudio()` i klicket gäller fortfarande).
  Saknas filen → tyst no-op (ingen crash).
- Avvisade alternativ: CC BY-NC-ljud (FreeSoundLibrary/OrangeFreeSounds – icke-kommersiellt,
  risk för publik app), Freepik/Vecteezy (attribution/per-item villkor).

### 10.5 Iterationsplan V2 (checklista)

- [x] 1. **Dokument** (detta)
- [x] 2. **theme.ts**: +halloween/christmas i `ThemeName`, `THEME_OPTIONS`, validering
- [x] 3. **index.css**: `[data-season]` → `[data-theme]` (paletter + body-gradients)
- [x] 4. **App.tsx**: lyft theme-state, ta bort DB-fetch/polling, dekor + ljudprop från theme
- [x] 5. **ThemeSwitcher.tsx**: controlled, +🎃/🎄-knappar
- [x] 6. **Radera admin**: `AdminSeasonalTheme.tsx`, `seasonalTheme.ts` (+test), koppling i AdminChallenges
- [x] 7. **Cleanup**: radera 004/005 ur repo (006 var lokal-only och togs ur repo)
- [x] 8. **Tests**: theme.test.ts (nya värden), uppdatera SeasonalDecor-test, radera seasonalTheme.test
- [x] 9. **QA + build + commit + dokument** (197 test gröna, build OK)

## 9. Progress-logg

### 2026-10-24
- Websök för inspiration (se avsn. 3).
- Dokumentet skrivet.
- Iter A–E genomförda (paletter, tåka/vignett, fallande löv, vinge-flap,
  visibility-pause, `--decor-glow`, `seasonalSound.ts` med spök-vissling +
  jingle, SQL 004 + 005, admin-panel).
- **Sessionen dog** när den försökte ladda in en skärmdump som bild i
  sessionen (möjligt inte). Läxan är nu en regel i avsn. 2: QA görs
  textbaserat via `browser.evaluate` – aldrig `browser.screenshot`.
- Fortsättning: alla 194 test gröna, build OK.
- **Iter D (browser-QA) pausad**: ingen desktop-browser var kopplad till
  sessionen, så interaktiva kontroller kunde inte köras. Logiken är täckt av
  unit-testerna (SeasonalDecor: 18 halloween-objekt, 16 christmas-objekt,
  tåka/vignett, motioner, `wideOnly`-split). Visuell QA gör användaren i
  appen (eller sessionen når köra `browser.evaluate`-kontroller när en
  browser är kopplad).
- Arbetet commitat (`feat/seasonal-theme`).

### V2 (2026-10-24)
- Beslut: säsongerna blir fritt valbara teman (avsn. 10).
- Databasen: `site_settings` existerar (004 kört i tidig version, utan
  christmas) → migration 006 droppar tabellen.
- V2 implementerad: säsongsteman i temaväxjaren (🎃/🎄), per-enhet i
  localStorage, admin-funktionen + `site_settings` borta. 197 test gröna,
  build OK. Kommit.
- **Uppdatering**: 006 (`drop site_settings`) kördes bara i den lokala DB:en
  och togs ur repo – inget databasarbete kvar.
- Christmas-extras beslutade (avsn. 10.4): ljud = Pixabay-klipp (S1),
  snö = CSS snow caps (S2) + video-loop (S3). Research + tillitskoll av
  licenser dokumenterad.
- Christmas-extras implementerade: `seasonalSound.ts` fetchar + decodar
  `public/jingle-bells.mp3` en gång (cachad buffer, tyst no-op om filen
  saknas); snow caps på `.bg-raised.rounded-2xl`-kort; helsingrämss
  `<video>`-loop (muted, `mix-blend-mode: screen`, pausas vid dold tabb).
  198 test gröna, build OK, commitat.
- **Kvar (användaren)**: ladda ner `public/jingle-bells.mp3` (Pixabay
  #439615) och `public/snowfall.mp4` (Pixabay/Mixkit) och lägg i `public/`.
  → **Klart**: båda filerna nedladdade, omdöpta och commitade.
- **Grönskärms-fix**: clippen visade sig ha grön chroma-key-bakgrund
  (`mix-blend-mode: screen` räckte inte). Löst med canvas-chroma key:
  `SnowfallVideo` ritar videon till canvas och nollar alfa på
  grön-dominanta pixlar (`g > 60 && g > r+25 && g > b+25`). 198 test gröna,
  build OK, commitat.
- Notering: canvas-loopen är CPU-tung vid stora viewporter. Om den känns
  seg på mobil: byt clippen mot en med svart bakgrund (då räckte
  `mix-blend-mode: screen` och canvasen kunde tas bort).
- **Användarjusteringar**: snow caps på korten **tagna bort** (såg fula ut);
  snövideon **saktad** (`playbackRate = 0.6`); Halloween-ljudet bytt till
  **ulvsskrik** (`wolf-howl.mp3`) – båda säsongerna spelar nu klippfiler
  via en delad, per-fil-cachelad `loadSoundBuffer`/`playClip` i
  `seasonalSound.ts`. Syntes-moanet raderat.
- **Ljud-justeringar**: `warmUpAudio(theme)` **prefetchar** nu klippet i
  klickgesten (fixar iOS-timing) + `console.warn`-diagnostik vid
  ljudfel (ingen tyst no-op längre). Uvvskriket startar **0,2 s in** i
  klippet (`playClip`-offset) för att hoppa över inledning.
- **Enda ljudet i taget**: `playClip` stoppar (80 ms fade-out) ett
  pågående ljud innan det nya startar – snabba loggar ger inga
  överlapp. Senaste loggen "vinner".
- **Snö-video prestanda**: chroma key-loopen var seg (full upplösning +
  60 fps pixel-copy). Optimerat: canvas i reducerad upplösning
  (max 960 px bredd, CSS sträcker ut). Om det fortfarande känns segt:
  byt clippen till en med svart bakgrund → `mix-blend-mode: screen`,
  canvasen kan tas bort helt (GPU-only, nästan noll kostnad).
- **Snö-justeringar (användaren)**: snön faller lite långsammare
  (`SNOW_PLAYBACK_RATE = 0.5`) och loopen kör **60 fps igen**
  (`SNOW_MAX_FPS = 0`). Alla tre dialar (`SNOW_PLAYBACK_RATE`,
  `SNOW_MAX_FPS`, `SNOW_MAX_CANVAS_WIDTH`) ligger i en tydligt
  markerad konfig-block i `SeasonalDecor.tsx` – lätta att byta/testa.
  (Användaren drev sedan `SNOW_PLAYBACK_RATE` ner till 0.4.)
- **Halloween: levande scen** – tre nya element (allt ren CSS + emoji,
  config-driven i `HALLOWEEN_DECOR`):
  1. **Krypande spindel** (wideOnly): kryper tvärs över toppkanten på
     en kort tråd (~45 s/rundtur, med små upphop) – ny motion `crawl`.
  2. **Will-o'-the-wisps** (alla storlekar, 2 st): små glödande gnistor
     (`✨`) som vandrar runt i scenen och pulserar i opacitet – ny
     motion `wisp` + drop-shadow-glöd.
  3. **Subtil blixt** (halloween only): fullskärmsdiv
     (`.seasonal-lightning`) som blinkar i en kort dubbelblixt
     (~var 27:e sekund, max ~9 % opacitet) – ligger bakom allt annat.
  - Blixten är med i `seasonal-paused` + `prefers-reduced-motion`.
  - Halloween-scenen har nu 21 dekor-objekt (10 wideOnly).
  - **Obs**: krypande spindel är `wideOnly` (dold < 1024 px viewport) –
    lätt att glömma bort vid smalt fönster/öppna DevTools.
- **Halloween-konfig-block**: `CRAWL_SPIDER_DURATION_S` (sek/rundtur),
  `WISP_DURATION_S` (sek/vandring), `LIGHTNING_INTERVAL_S` (sek mellan
  blixtar) + `LIGHTNING_MAX_OPACITY` (0–1, sätts som CSS-var
  `--lightning-max-opacity`). `0` döljer elementet helt. Wisps ökade
  i storlek (text-base/text-xl) för att bli synliga.
- **Reduced-motion-fallback fixad**: vid `prefers-reduced-motion` (t.ex.
  Windows "Animation effects" av) fick `.seasonal-lightning`
  `animation: none` → blev permanent osynlig (bas-opacitet 0). Nu
  `display: none` istället (blinkande overlay ska inte visas alls).
  Övriga decor-objekt blir statiskt synliga. _Upptäckt via just detta:
  användarens OS hade reduced motion på → inga animationer alls._
- **Användarjusteringar (scen + motion-override)**:
  - **Tomten borta** – `🎅` flygad item borttagen ur `CHRISTMAS_DECOR`
    (jul-scenen: 15 objekt, 4 wideOnly).
  - **Fladdermöss vända + långsammare**: ny `flip`-prop på `DecorItem`
    → emoji i eget `.seasonal-flip`-lager (`scaleX(-1)`, krockar inte
    med flap-animationen). `seasonal-fly-back`-keyframes tappade sin
    `scaleX(-1)` (emoji:en pekar redan åt vänster). Takter: 13/17/15 s
    → **18/22/20 s**.
  - **Stort spöke diagonal + blekare**: ny motion `drift`
    (`seasonal-drift`: in övre vänster → ut nedre höger, svag vängling),
    opacitet `opacity-50` → `opacity-25`.
  - **Motion-override**: kan nu override:a systemets reduced motion.
    `getMotionOverride`/`setMotionOverride` i `theme.ts` (localStorage
    `challenge-me:motion-override`); App.tsx sätter
    `.seasonal-motion-override` på `<html>` + lyssnar på
    `matchMedia`-ändringar live. Knapp (fast, höger ner) syns **endast**
    när systemet har reduced motion på + säsongstema aktivt – toggle
    på/av. CSS: reduced-motion-blocket är nu scopat till
    `:root:not(.seasonal-motion-override)`.
  - **Snö-video på/av**: ny var `SNOW_VIDEO_ENABLED` (konfig-blocket).
    `false` = ingen `SnowfallVideo` (canvas + video); emoji-snöflingorna
    (❄️) faller **alltid**, oavsett värdet.
- **`SNOW_MODE` ersätter `SNOW_VIDEO_ENABLED`** (3 lägen):
  - `0` = snö-video (chroma key) + emoji-snö – exakt som tidigare
  - `1` = ingen video – bara standard emoji-snö (❄️, 9 flingor)
  - `2` = ingen video – **täta emoji-snödrar** (22 flingor: ❄️ ❅ ❆
    blandade i tre djuplager – små/bleka/senare botten, medel i mitten,
    stora/ljusa/snabba framme) som simulerar videons snöfall. Ren CSS =
    ingen canvas-loop → ersätter videons prestandaproblem helt.
  - Config split: `CHRISTMAS_CORNER_DECOR` (granar/snöman/stjärnor/klocka,
    alla lägen) + `CHRISTMAS_SNOW_STANDARD` (9) + `CHRISTMAS_SNOW_DENSE`
    (22). `CHRISTMAS_DECOR` = standard+hörn; `CHRISTMAS_DECOR_DENSE` =
    täta+hörn (mode 2). Videon renderas **bara** i mode 0.
  - Standard nu: `SNOW_MODE = 2` (videon seg).
  - **Snödikhets x2**: `CHRISTMAS_SNOW_DENSE` dubblerad 22 → **44**
    flingor (botten 20 / mellan 14 / fram 10) – täcker skärmen tätare
    utan tätt mönster (positioner/delay spridda).
  - Obs: ❅/❆ är text-glyfer (monokroma, ärver `color`) – renderas
    vitaktiga på julpalettens mörka bakgrund.
- **Snö-videon borttagen (cleanup, YAGNI/DRY)**: användaren nöjd med de
  täta emoji-snöflingorna → videopålet ut. Raderat: `SnowfallVideo`
  (canvas + chroma key), `public/snowfall.mp4` (11.4 MB), `SNOW_MODE` +
  `SNOW_PLAYBACK_RATE`/`SNOW_MAX_FPS`/`SNOW_MAX_CANVAS_WIDTH`,
  `CHRISTMAS_SNOW_STANDARD`, `CHRISTMAS_DECOR_DENSE`, `.seasonal-snow-video`
  CSS. Täta emoji-snödrar är nu det enda snöläget: `CHRISTMAS_SNOW`
  (44 flingor) + `CHRISTMAS_CORNER_DECOR` → `CHRISTMAS_DECOR`.
  **Tests**: +motion-override (theme.test.ts), +ThemeSwitcher.test.tsx
  (ny fil: 5 radio-knappar, 🎃/🎄, exakt en `aria-checked`).
  Hela grenen squashead till ett commit.
- _(fortsätter…)_
