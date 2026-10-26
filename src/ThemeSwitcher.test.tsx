import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ThemeSwitcher from "./ThemeSwitcher";

describe("ThemeSwitcher", () => {
  it("renders one radio button per theme option, incl. both seasonal themes", () => {
    const html = renderToString(<ThemeSwitcher theme="light" onSelect={() => {}} />);

    expect(html.match(/role="radio"/g)).toHaveLength(5);
    expect(html).toContain("🎃");
    expect(html).toContain("🎄");
  });

  it("marks exactly the active theme as checked", () => {
    const halloween = renderToString(
      <ThemeSwitcher theme="halloween" onSelect={() => {}} />,
    );
    expect(halloween.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(halloween).toContain('aria-checked="true" title="Halloween 🎃"');

    const christmas = renderToString(
      <ThemeSwitcher theme="christmas" onSelect={() => {}} />,
    );
    expect(christmas.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(christmas).toContain('aria-checked="true" title="Christmas 🎄"');
  });
});
