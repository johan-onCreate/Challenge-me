import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_BY_ID } from "../achievements";
import { BadgeCard } from "./BadgeCard";

const reptile = ACHIEVEMENT_BY_ID.get("reps.1k");
const sloth = ACHIEVEMENT_BY_ID.get("troll.1");
const throne = ACHIEVEMENT_BY_ID.get("comp.throne");

if (!reptile || !sloth || !throne) {
  throw new Error("Test badgar saknas i katalogen");
}

describe("BadgeCard", () => {
  it("renders an earned badge with check mark and unlock date", () => {
    const html = renderToString(
      <BadgeCard
        achievement={reptile}
        state="earned"
        unlockedAt="2026-10-05T10:00:00Z"
      />,
    );
    expect(html).toContain("The Reptile");
    expect(html).toContain("1 000 totala reps");
    expect(html).toContain("✓");
    expect(html).toContain("5 okt");
  });

  it("renders an in-progress badge with count progress", () => {
    const html = renderToString(
      <BadgeCard
        achievement={reptile}
        state="progress"
        progress={{ kind: "count", current: 742, target: 1000 }}
      />,
    );
    expect(html).toContain("The Reptile");
    expect(html).toContain("742 / 1000");
    expect(html).not.toContain("✓");
  });

  it("renders an in-progress badge with free-form text progress", () => {
    const html = renderToString(
      <BadgeCard
        achievement={throne}
        state="progress"
        progress={{ kind: "text", text: "Du är #4 i din grupp" }}
      />,
    );
    expect(html).toContain("Du är #4 i din grupp");
  });

  it("renders a locked badge with hint and no progress", () => {
    const html = renderToString(<BadgeCard achievement={sloth} state="locked" />);
    expect(html).toContain("Lazy Sloth");
    expect(html).toContain("Exakt 1 rep på en dag");
    expect(html).not.toContain("✓");
  });
});
