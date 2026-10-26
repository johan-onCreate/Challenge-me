import { useEffect, type CSSProperties } from "react";
import { isSeasonalTheme } from "../theme";
import type { SeasonalThemeName, ThemeName } from "../theme";

type DecorMotion =
  | "float"
  | "fly"
  | "fly-back"
  | "drift"
  | "swing"
  | "crawl"
  | "wisp"
  | "hover"
  | "glow"
  | "fall";

interface DecorItem {
  emoji: string;
  top?: string;
  bottom?: string;
  left?: string;
  size: string;
  motion: DecorMotion;
  /** Negativ delay sprider objekten över cykeln direkt vid laddning */
  delay: string;
  duration: string;
  /** Trådlängd i px (endast för hängande spindel) */
  thread?: number;
  className?: string;
  /**
   * Endast på bredare skärmer (lg+). På smala/zoomade viewporter ligger
   * "skärmkanten" ovanför innehållet, så animerat sällskap döljs där.
   */
  wideOnly?: boolean;
  /** Ving-puls (inre lager) – för fladdermöss */
  flap?: boolean;
  /** Vänd emoji horisontellt (t.ex. fladdermus som flyger åt höger) */
  flip?: boolean;
  /** Statisk glöd (t.ex. måne) */
  staticGlow?: boolean;
}

// ────────────────────────────────────────────────────────────────────
// HALLOWEEN: "levande" element – ändra här för att testa
// (0 = dölj elementet helt)
// ────────────────────────────────────────────────────────────────────
/** Spindelns rundtur över toppkanten, i sekunder. Lägre = oftare. */
const CRAWL_SPIDER_DURATION_S = 40;
/** Wisps' vandring, i sekunder. Lägre = snabbare ronder. */
const WISP_DURATION_S = 16;
/** Sekunder mellan blixtarna. */
const LIGHTNING_INTERVAL_S = 20;
/** Blixtens topp-opacitet (0–1). 0.09 = subtil, 0.2 = tydlig. */
const LIGHTNING_MAX_OPACITY = 0.09;
// ────────────────────────────────────────────────────────────────────

const HALLOWEEN_DECOR: DecorItem[] = [
  // --- Alltid synliga: hörnobjekt + fallande löv ---
  // Spindelvevor i hörnen
  { emoji: "🕸️", top: "1%", left: "1%", size: "text-4xl", motion: "float", delay: "0s", duration: "9s" },
  { emoji: "🕸️", top: "1%", left: "88%", size: "text-3xl", motion: "float", delay: "-4s", duration: "10s" },
  // Månen – scenens "ljuskälla"
  { emoji: "🌕", top: "3%", left: "68%", size: "text-5xl", motion: "float", delay: "-2s", duration: "12s", staticGlow: true },
  // Glödande pumpor i botten
  { emoji: "🎃", bottom: "2%", left: "2%", size: "text-5xl", motion: "glow", delay: "0s", duration: "3s" },
  { emoji: "🎃", bottom: "3%", left: "87%", size: "text-4xl", motion: "glow", delay: "-1.4s", duration: "3.6s" },
  // Fallande höstlöv (låg opacitet, roterar ner över skärmen)
  { emoji: "🍂", top: "0%", left: "12%", size: "text-lg", motion: "fall", delay: "-3s", duration: "13s", className: "opacity-50" },
  { emoji: "🍂", top: "0%", left: "38%", size: "text-lg", motion: "fall", delay: "-9s", duration: "17s", className: "opacity-50" },
  { emoji: "🍁", top: "0%", left: "64%", size: "text-lg", motion: "fall", delay: "-14s", duration: "21s", className: "opacity-40" },
  { emoji: "🍁", top: "0%", left: "86%", size: "text-lg", motion: "fall", delay: "-19s", duration: "25s", className: "opacity-40" },
  // Will-o'-the-wisps: glödande gnistor som vandrar runt (opacitet styrs av keyframes)
  ...(WISP_DURATION_S > 0
    ? [
        { emoji: "✨", top: "32%", left: "14%", size: "text-base", motion: "wisp" as const, delay: "-3s", duration: `${WISP_DURATION_S * 0.95}s` },
        { emoji: "✨", top: "64%", left: "76%", size: "text-xl", motion: "wisp" as const, delay: "-11s", duration: `${WISP_DURATION_S * 1.15}s` },
      ]
    : []),

  // --- Endast på breda skärmer: flygande/svävande sällskap ---
  // Fladdermöss som flyger tvärs över skärmen (ving-puls + vända så de
  // flyger med huvudet framåt)
  { emoji: "🦇", top: "6%", size: "text-3xl", motion: "fly", delay: "-2s", duration: "18s", wideOnly: true, flap: true, flip: true, className: "opacity-75" },
  { emoji: "🦇", top: "24%", size: "text-xl", motion: "fly", delay: "-9s", duration: "22s", wideOnly: true, flap: true, flip: true, className: "opacity-75" },
  { emoji: "🦇", top: "14%", left: "100%", size: "text-2xl", motion: "fly-back", delay: "-5s", duration: "20s", wideOnly: true, flap: true, className: "opacity-75" },
  // Spöken som svävar (med fade) + ett stort, blekt som drar diagonalt
  { emoji: "👻", top: "10%", left: "84%", size: "text-4xl", motion: "hover", delay: "-1s", duration: "8s", wideOnly: true },
  { emoji: "👻", top: "58%", left: "4%", size: "text-3xl", motion: "hover", delay: "-4.5s", duration: "9s", wideOnly: true },
  { emoji: "👻", top: "38%", size: "text-5xl", motion: "drift", delay: "-12s", duration: "38s", wideOnly: true, className: "opacity-25" },
  // Spindlar som svungar på trådar
  { emoji: "🕷️", top: "0%", left: "14%", size: "text-2xl", motion: "swing", delay: "0s", duration: "3.4s", thread: 64, wideOnly: true },
  { emoji: "🕷️", top: "0%", left: "86%", size: "text-xl", motion: "swing", delay: "-1s", duration: "4.2s", thread: 96, wideOnly: true },
  // Spindel som kryper tvärs över toppkanten på en kort tråd (långsam rundtur)
  ...(CRAWL_SPIDER_DURATION_S > 0
    ? [
        { emoji: "🕷️", top: "0%", size: "text-2xl", motion: "crawl" as const, delay: "-12s", duration: `${CRAWL_SPIDER_DURATION_S}s`, thread: 40, wideOnly: true },
      ]
    : []),
  // Godis
  { emoji: "🍬", top: "72%", left: "93%", size: "text-2xl", motion: "float", delay: "-3s", duration: "6s", wideOnly: true },
];

// Hörnobjekt (granar, snöman, stjärnor, klocka) – samma i alla snö-lägen
const CHRISTMAS_CORNER_DECOR: DecorItem[] = [
  // Granar i bottenhörnen (grön glöd via --decor-glow)
  { emoji: "🎄", bottom: "2%", left: "2%", size: "text-5xl", motion: "glow", delay: "0s", duration: "3.4s" },
  { emoji: "🎄", bottom: "3%", left: "87%", size: "text-4xl", motion: "glow", delay: "-1.6s", duration: "3.8s" },
  // Snöman + glittrande stjärnor
  { emoji: "⛄", bottom: "4%", left: "46%", size: "text-3xl", motion: "float", delay: "-2s", duration: "7s", className: "opacity-80" },
  { emoji: "✨", top: "22%", left: "6%", size: "text-xl", motion: "float", delay: "-1s", duration: "5s", className: "opacity-70" },
  { emoji: "✨", top: "64%", left: "92%", size: "text-xl", motion: "float", delay: "-3s", duration: "6s", className: "opacity-70" },
  // Svävande klocka
  { emoji: "🔔", top: "18%", left: "82%", size: "text-3xl", motion: "hover", delay: "-2s", duration: "8s", wideOnly: true },
];

// Täta emoji-snödrar – ❄️ ❅ ❆ blandade i tre djuplager
// (liten/mörk/sent = botten, stor/ljus/snabb = framsida) som tillsammans
// bildar ett fullt snöfall. Ren CSS = inget canvas-arbete, bra prestanda.
const CHRISTMAS_SNOW: DecorItem[] = [
  // Bottenlager: små, bleka, långsamma
  { emoji: "❅", top: "0%", left: "4%", size: "text-xs", motion: "fall", delay: "-2s", duration: "24s", className: "opacity-30" },
  { emoji: "❆", top: "0%", left: "13%", size: "text-sm", motion: "fall", delay: "-11s", duration: "21s", className: "opacity-40" },
  { emoji: "❄️", top: "0%", left: "22%", size: "text-xs", motion: "fall", delay: "-17s", duration: "25s", className: "opacity-30" },
  { emoji: "❅", top: "0%", left: "31%", size: "text-sm", motion: "fall", delay: "-6s", duration: "23s", className: "opacity-30" },
  { emoji: "❆", top: "0%", left: "40%", size: "text-xs", motion: "fall", delay: "-14s", duration: "26s", className: "opacity-40" },
  { emoji: "❄️", top: "0%", left: "49%", size: "text-sm", motion: "fall", delay: "-20s", duration: "22s", className: "opacity-30" },
  { emoji: "❅", top: "0%", left: "58%", size: "text-xs", motion: "fall", delay: "-3s", duration: "25s", className: "opacity-40" },
  { emoji: "❆", top: "0%", left: "67%", size: "text-sm", motion: "fall", delay: "-9s", duration: "23s", className: "opacity-30" },
  { emoji: "❄️", top: "0%", left: "76%", size: "text-xs", motion: "fall", delay: "-16s", duration: "24s", className: "opacity-40" },
  { emoji: "❅", top: "0%", left: "90%", size: "text-sm", motion: "fall", delay: "-21s", duration: "22s", className: "opacity-30" },
  { emoji: "❆", top: "0%", left: "1%", size: "text-xs", motion: "fall", delay: "-7s", duration: "22s", className: "opacity-30" },
  { emoji: "❄️", top: "0%", left: "9%", size: "text-sm", motion: "fall", delay: "-19s", duration: "24s", className: "opacity-40" },
  { emoji: "❅", top: "0%", left: "17%", size: "text-xs", motion: "fall", delay: "-12s", duration: "26s", className: "opacity-30" },
  { emoji: "❆", top: "0%", left: "26%", size: "text-sm", motion: "fall", delay: "-1s", duration: "23s", className: "opacity-30" },
  { emoji: "❄️", top: "0%", left: "35%", size: "text-xs", motion: "fall", delay: "-23s", duration: "25s", className: "opacity-40" },
  { emoji: "❅", top: "0%", left: "44%", size: "text-sm", motion: "fall", delay: "-15s", duration: "21s", className: "opacity-30" },
  { emoji: "❆", top: "0%", left: "53%", size: "text-xs", motion: "fall", delay: "-8s", duration: "24s", className: "opacity-30" },
  { emoji: "❄️", top: "0%", left: "62%", size: "text-sm", motion: "fall", delay: "-22s", duration: "26s", className: "opacity-40" },
  { emoji: "❅", top: "0%", left: "82%", size: "text-xs", motion: "fall", delay: "-10s", duration: "23s", className: "opacity-30" },
  { emoji: "❆", top: "0%", left: "95%", size: "text-sm", motion: "fall", delay: "-18s", duration: "22s", className: "opacity-40" },
  // Mellanlager: medelstora, tydliga
  { emoji: "❄️", top: "0%", left: "8%", size: "text-base", motion: "fall", delay: "-5s", duration: "17s", className: "opacity-50" },
  { emoji: "❆", top: "0%", left: "19%", size: "text-lg", motion: "fall", delay: "-12s", duration: "15s", className: "opacity-60" },
  { emoji: "❅", top: "0%", left: "35%", size: "text-base", motion: "fall", delay: "-8s", duration: "18s", className: "opacity-50" },
  { emoji: "❄️", top: "0%", left: "46%", size: "text-lg", motion: "fall", delay: "-15s", duration: "14s", className: "opacity-60" },
  { emoji: "❆", top: "0%", left: "57%", size: "text-base", motion: "fall", delay: "-2s", duration: "16s", className: "opacity-50" },
  { emoji: "❅", top: "0%", left: "71%", size: "text-lg", motion: "fall", delay: "-10s", duration: "15s", className: "opacity-60" },
  { emoji: "❄️", top: "0%", left: "84%", size: "text-base", motion: "fall", delay: "-18s", duration: "17s", className: "opacity-50" },
  { emoji: "❅", top: "0%", left: "3%", size: "text-base", motion: "fall", delay: "-14s", duration: "16s", className: "opacity-50" },
  { emoji: "❄️", top: "0%", left: "14%", size: "text-lg", motion: "fall", delay: "-6s", duration: "14s", className: "opacity-60" },
  { emoji: "❆", top: "0%", left: "28%", size: "text-base", motion: "fall", delay: "-11s", duration: "17s", className: "opacity-50" },
  { emoji: "❅", top: "0%", left: "41%", size: "text-lg", motion: "fall", delay: "-3s", duration: "15s", className: "opacity-60" },
  { emoji: "❄️", top: "0%", left: "52%", size: "text-base", motion: "fall", delay: "-16s", duration: "18s", className: "opacity-50" },
  { emoji: "❆", top: "0%", left: "66%", size: "text-lg", motion: "fall", delay: "-9s", duration: "14s", className: "opacity-60" },
  { emoji: "❅", top: "0%", left: "78%", size: "text-base", motion: "fall", delay: "-13s", duration: "16s", className: "opacity-50" },
  // Framlager: stora, ljusa, snabba
  { emoji: "❄️", top: "0%", left: "11%", size: "text-2xl", motion: "fall", delay: "-4s", duration: "11s", className: "opacity-80" },
  { emoji: "❅", top: "0%", left: "27%", size: "text-xl", motion: "fall", delay: "-9s", duration: "12s", className: "opacity-70" },
  { emoji: "❆", top: "0%", left: "44%", size: "text-2xl", motion: "fall", delay: "-13s", duration: "10s", className: "opacity-80" },
  { emoji: "❅", top: "0%", left: "63%", size: "text-xl", motion: "fall", delay: "-7s", duration: "12s", className: "opacity-70" },
  { emoji: "❄️", top: "0%", left: "81%", size: "text-2xl", motion: "fall", delay: "-1s", duration: "11s", className: "opacity-90" },
  { emoji: "❅", top: "0%", left: "6%", size: "text-xl", motion: "fall", delay: "-11s", duration: "11s", className: "opacity-70" },
  { emoji: "❄️", top: "0%", left: "18%", size: "text-2xl", motion: "fall", delay: "-2s", duration: "12s", className: "opacity-80" },
  { emoji: "❆", top: "0%", left: "34%", size: "text-xl", motion: "fall", delay: "-8s", duration: "10s", className: "opacity-70" },
  { emoji: "❅", top: "0%", left: "54%", size: "text-2xl", motion: "fall", delay: "-5s", duration: "12s", className: "opacity-80" },
  { emoji: "❄️", top: "0%", left: "74%", size: "text-xl", motion: "fall", delay: "-12s", duration: "11s", className: "opacity-90" },
];

const CHRISTMAS_DECOR: DecorItem[] = [
  ...CHRISTMAS_SNOW,
  ...CHRISTMAS_CORNER_DECOR,
];

// Ny säsong = ny rad i denna mappning + ny palett i index.css.
const DECOR_CONFIGS: Record<SeasonalThemeName, DecorItem[]> = {
  halloween: HALLOWEEN_DECOR,
  christmas: CHRISTMAS_DECOR,
};

export default function SeasonalDecor({ theme }: { theme: ThemeName }) {
  // Battery-friendly: pausa CSS-animationerna när tabben är dold
  useEffect(() => {
    if (!isSeasonalTheme(theme)) return;

    const onVisibilityChange = () => {
      document.documentElement.classList.toggle(
        "seasonal-paused",
        document.visibilityState === "hidden",
      );
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    onVisibilityChange();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.documentElement.classList.remove("seasonal-paused");
    };
  }, [theme]);

  if (!isSeasonalTheme(theme)) return null;

  const items = DECOR_CONFIGS[theme];
  if (items.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {/* Halloween: subtil blixt i natten (bakom allt annat) */}
      {theme === "halloween" && LIGHTNING_INTERVAL_S > 0 && (
        <div
          className="seasonal-lightning"
          style={
            {
              animationDuration: `${LIGHTNING_INTERVAL_S}s`,
              "--lightning-max-opacity": LIGHTNING_MAX_OPACITY,
            } as CSSProperties
          }
        />
      )}

      {/* Atmosfär: drivande tåka + cinematiskt vignet */}
      <div className="seasonal-fog" />
      <div className="seasonal-fog seasonal-fog--far" />
      <div className="seasonal-vignette" />

      {items.map((item, index) => {
        const itemStyle: CSSProperties = {
          animationDelay: item.delay,
          animationDuration: item.duration,
        };

        const emojiClass = [
          item.staticGlow ? "seasonal-moon" : "",
          item.flap ? "seasonal-flap" : "",
        ]
          .filter(Boolean)
          .join(" ");

        // Vänd emoji på eget lager så flip inte krockar med flap-animationen
        const emojiContent = item.flip ? (
          <span className="seasonal-flip">{item.emoji}</span>
        ) : (
          item.emoji
        );

        return (
          <span
            key={index}
            className={`absolute ${item.wideOnly ? "hidden lg:block" : ""}`}
            style={{ top: item.top, bottom: item.bottom, left: item.left }}
          >
            <span
              className={`seasonal-decor-item seasonal-motion-${item.motion} select-none ${item.size} ${item.className ?? ""}`.trim()}
              style={itemStyle}
            >
              {(item.motion === "swing" || item.motion === "crawl") && (
                <span
                  className="decor-thread"
                  style={{ height: item.thread }}
                />
              )}
              {emojiClass ? (
                <span className={emojiClass}>{emojiContent}</span>
              ) : (
                emojiContent
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
