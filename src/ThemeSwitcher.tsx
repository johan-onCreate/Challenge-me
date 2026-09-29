import { useState } from "react";
import type { ReactNode } from "react";
import { getInitialTheme, setTheme, THEME_OPTIONS } from "./theme";
import type { ThemeName } from "./theme";

const ICONS: Record<ThemeName, ReactNode> = {
  light: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  pink: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
};

export default function ThemeSwitcher() {
  const [theme, setThemeState] = useState<ThemeName>(() => getInitialTheme());

  const select = (next: ThemeName) => {
    setTheme(next);
    setThemeState(next);
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-inset p-0.5"
      role="radiogroup"
      aria-label="Välj tema"
    >
      {THEME_OPTIONS.map((option) => {
        const active = option.id === theme;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.label}
            aria-label={option.label}
            onClick={() => select(option.id)}
            className={`rounded-md p-1.5 transition-colors ${
              active
                ? "bg-raised text-content shadow-sm"
                : "text-content-faint hover:text-content"
            }`}
          >
            {ICONS[option.id]}
          </button>
        );
      })}
    </div>
  );
}
