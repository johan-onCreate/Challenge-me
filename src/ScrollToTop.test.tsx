import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ScrollToTop from "./ScrollToTop";

describe("ScrollToTop", () => {
  it("renders nothing inside a router", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/profile"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(html).toBe("");
  });
});
