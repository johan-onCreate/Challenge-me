export type ThemeName = "light" | "dark" | "pink";

export const THEME_OPTIONS: Array<{ id: ThemeName; label: string }> = [
  { id: "light", label: "Ljust" },
  { id: "dark", label: "Mörkt" },
  { id: "pink", label: "Rosa" },
];

const STORAGE_KEY = "challenge-me:theme";

export function getInitialTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "pink") {
      return stored;
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
