import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_BY_ID } from "../achievements";
import { UnlockCelebration } from "./UnlockCelebration";

const sloth = ACHIEVEMENT_BY_ID.get("troll.1");
const imp = ACHIEVEMENT_BY_ID.get("troll.666");

if (!sloth || !imp) {
  throw new Error("Test badgar saknas i katalogen");
}

describe("UnlockCelebration", () => {
  it("renders the first queued badge and nothing else", () => {
    const html = renderToString(
      <UnlockCelebration
        achievements={[sloth, imp]}
        onDone={() => undefined}
      />,
    );
    expect(html).toContain("Ny pris! 🎉");
    expect(html).toContain("Lazy Sloth");
    expect(html).not.toContain("Imp");
  });

  it("renders nothing for an empty queue", () => {
    const html = renderToString(
      <UnlockCelebration achievements={[]} onDone={() => undefined} />,
    );
    expect(html).toBe("");
  });
});
