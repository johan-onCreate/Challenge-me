import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getInitialTheme,
  getMotionOverride,
  isSeasonalTheme,
  setMotionOverride,
  setTheme,
  THEME_OPTIONS,
} from "./theme";

function stubStorage(value: string | null) {
  const storage: Record<string, string> = {};
  if (value !== null) storage["challenge-me:theme"] = value;
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => {
      storage[key] = val;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      for (const key of Object.keys(storage)) delete storage[key];
    },
    key: () => null,
    get length() {
      return Object.keys(storage).length;
    },
  } as unknown as Storage;
}

function stubDocument() {
  const setAttribute = vi.fn();
  (globalThis as { document?: Document }).document = {
    documentElement: { setAttribute },
  } as unknown as Document;
  return setAttribute;
}

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
  delete (globalThis as { document?: Document }).document;
});

describe("THEME_OPTIONS", () => {
  it("contains the three regular themes plus both seasonal themes", () => {
    expect(THEME_OPTIONS.map((option) => option.id)).toEqual([
      "light",
      "dark",
      "pink",
      "halloween",
      "christmas",
    ]);
  });
});

describe("isSeasonalTheme", () => {
  it("is true only for halloween and christmas", () => {
    expect(isSeasonalTheme("halloween")).toBe(true);
    expect(isSeasonalTheme("christmas")).toBe(true);
    expect(isSeasonalTheme("light")).toBe(false);
    expect(isSeasonalTheme("dark")).toBe(false);
    expect(isSeasonalTheme("pink")).toBe(false);
  });
});

describe("getInitialTheme", () => {
  it("returns a stored seasonal theme", () => {
    stubStorage("halloween");
    expect(getInitialTheme()).toBe("halloween");

    stubStorage("christmas");
    expect(getInitialTheme()).toBe("christmas");
  });

  it("falls back to light for an unknown stored value", () => {
    stubStorage("black_friday");
    expect(getInitialTheme()).toBe("light");
  });

  it("falls back to light when nothing is stored", () => {
    stubStorage(null);
    expect(getInitialTheme()).toBe("light");
  });
});

describe("setTheme", () => {
  it("applies data-theme on <html> and persists the choice", () => {
    const setAttribute = stubDocument();
    stubStorage(null);

    setTheme("christmas");

    expect(setAttribute).toHaveBeenCalledWith("data-theme", "christmas");
    expect(getInitialTheme()).toBe("christmas");
  });
});

describe("motion override (reduced-motion)", () => {
  it("defaults to false when nothing is stored", () => {
    stubStorage(null);
    expect(getMotionOverride()).toBe(false);
  });

  it("persists the choice and reads it back", () => {
    stubStorage(null);

    setMotionOverride(true);
    expect(getMotionOverride()).toBe(true);

    setMotionOverride(false);
    expect(getMotionOverride()).toBe(false);
  });
});
