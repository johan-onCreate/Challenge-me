import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SeasonalDecor from "./SeasonalDecor";

describe("SeasonalDecor", () => {
  it("renders nothing when a regular theme is active", () => {
    expect(renderToString(<SeasonalDecor theme="light" />)).toBe("");
    expect(renderToString(<SeasonalDecor theme="dark" />)).toBe("");
    expect(renderToString(<SeasonalDecor theme="pink" />)).toBe("");
  });

  it("renders spooky, non-interactive decor for halloween", () => {
    const html = renderToString(<SeasonalDecor theme="halloween" />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events-none");
    for (const emoji of ["🎃", "👻", "🦇", "🕷️", "🕸️", "🌕", "🍂"]) {
      expect(html).toContain(emoji);
    }
  });

  it("renders the atmosphere layers (fog + vignette)", () => {
    const html = renderToString(<SeasonalDecor theme="halloween" />);

    // Räknar fog-divarna via class-attributets start
    expect(html.match(/class="seasonal-fog/g)).toHaveLength(2);
    expect(html).toContain("seasonal-vignette");
  });

  it("renders one animated item per configured halloween decoration", () => {
    const html = renderToString(<SeasonalDecor theme="halloween" />);

    expect(html.match(/seasonal-decor-item/g)).toHaveLength(21);
    expect(html.match(/animation-delay:/g)).toHaveLength(21);
  });

  it("hides the moving cast on narrow viewports, keeps corner items", () => {
    const html = renderToString(<SeasonalDecor theme="halloween" />);

    // 10 av 21 objekt (fladdermöss, spöken, spindlar, godis) är breda-skärmar-only
    expect(html.match(/hidden lg:block/g)).toHaveLength(10);
  });

  it("uses moving animations incl. wing-flap, moon glow and spider threads", () => {
    const html = renderToString(<SeasonalDecor theme="halloween" />);

    expect(html).toContain("seasonal-motion-fly ");
    expect(html).toContain("seasonal-motion-fly-back");
    expect(html).toContain("seasonal-motion-swing");
    expect(html).toContain("seasonal-motion-crawl");
    expect(html).toContain("seasonal-motion-wisp");
    expect(html).toContain("seasonal-motion-drift");
    expect(html).toContain("seasonal-flip");
    expect(html).toContain("seasonal-motion-hover");
    expect(html).toContain("seasonal-motion-glow");
    expect(html).toContain("seasonal-motion-fall");
    expect(html.match(/seasonal-flap/g)).toHaveLength(3);
    expect(html).toContain("seasonal-moon");
    // 2 svängande spindlar + 1 krypande spindel har trådar
    expect(html.match(/decor-thread/g)).toHaveLength(3);
  });

  it("renders a subtle lightning layer for halloween (and only halloween)", () => {
    const halloween = renderToString(<SeasonalDecor theme="halloween" />);
    expect(halloween).toContain("seasonal-lightning");

    const christmas = renderToString(<SeasonalDecor theme="christmas" />);
    expect(christmas).not.toContain("seasonal-lightning");
  });

  it("renders a distinct christmas scene", () => {
    const html = renderToString(<SeasonalDecor theme="christmas" />);

    // 44 snöflingor + 6 hörnobjekt; 1 wideOnly (klockan)
    expect(html.match(/seasonal-decor-item/g)).toHaveLength(50);
    expect(html.match(/hidden lg:block/g)).toHaveLength(1);
    for (const emoji of ["❄️", "❅", "❆", "🎄", "⛄", "🔔", "✨"]) {
      expect(html).toContain(emoji);
    }
    // Ingen Tomte längre – snön faller, granarna glöder
    expect(html).not.toContain("🎅");
    expect(html).not.toContain("seasonal-motion-fly");
    expect(html).toContain("seasonal-motion-fall");
    expect(html).toContain("seasonal-motion-glow");
  });

});
