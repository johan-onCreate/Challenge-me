import { describe, expect, it } from "vitest";
import { playSeasonalSound, warmUpAudio } from "./seasonalSound";

describe("seasonal sound", () => {
  it("is a safe no-op in environments without AudioContext (node)", () => {
    expect(() => warmUpAudio()).not.toThrow();
    expect(() => playSeasonalSound("halloween")).not.toThrow();
    expect(() => playSeasonalSound("christmas")).not.toThrow();
  });
});
