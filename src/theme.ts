export type ThemeName = "light" | "dark" | "pink" | "halloween" | "christmas";

/** Säsongsteman – de med dekor (SeasonalDecor) + belöningsljud vid logg */
export type SeasonalThemeName = "halloween" | "christmas";

export function isSeasonalTheme(theme: ThemeName): theme is SeasonalThemeName {
  return theme === "halloween" || theme === "christmas";
}

export const THEME_OPTIONS: Array<{ id: ThemeName; label: string }> = [
  { id: "light", label: "Ljust" },
  { id: "dark", label: "Mörkt" },
  { id: "pink", label: "Rosa" },
  { id: "halloween", label: "Halloween 🎃" },
  { id: "christmas", label: "Christmas 🎄" },
];

const STORAGE_KEY = "challenge-me:theme";

// Senaste säsongen: lägg till id:t här, i THEME_OPTIONS, DECOR_CONFIGS i
// SeasonalDecor och paletten ([data-theme="…"]) i index.css.
const ALL_THEMES: readonly ThemeName[] = THEME_OPTIONS.map((o) => o.id);

export function getInitialTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (ALL_THEMES as readonly string[]).includes(stored)) {
      return stored as ThemeName;
    }
  } catch {
    // localStorage unavailable (e.g. private mode) – fall through
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function setTheme(theme: ThemeName) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors – theme still applies for this session
  }
}

// Användarens override för systemets reduced-motion (säsongsanimationer).
// true = spela animationerna även om OS:et har "reducerad animation" på.
const MOTION_OVERRIDE_KEY = "challenge-me:motion-override";

export function getMotionOverride(): boolean {
  try {
    return localStorage.getItem(MOTION_OVERRIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMotionOverride(value: boolean) {
  try {
    localStorage.setItem(MOTION_OVERRIDE_KEY, value ? "1" : "0");
  } catch {
    // ignore storage errors – override gäller bara denna session
  }
}
