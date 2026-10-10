import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ChallengeCalendar from "./ChallengeCalendar";

const renderCalendar = () =>
  renderToString(
    <ChallengeCalendar
      startDate="2026-10-05"
      endDate="2026-10-11"
      todayDate="2026-10-07"
      loggedAmounts={new Map([["2026-10-06", 12]])}
      editingDate={null}
      editingAmount=""
      onEditingAmountChange={vi.fn()}
      onSelectDate={vi.fn()}
      onSave={vi.fn()}
      onCancel={vi.fn()}
    />,
  );

describe("ChallengeCalendar responsive layouts", () => {
  it("renders a spacious mobile list grouped by ISO week", () => {
    const html = renderCalendar();

    expect(html).toContain('class="grid grid-cols-1 gap-2 sm:hidden"');
    expect(html).toContain("Vecka <!-- -->41");
    expect(html).toContain("+ Logga");
    expect(html).toContain("12<!-- --> reps");
    expect(html).toContain("Idag");
  });

  it("renders the desktop seven-day grid with week-number column", () => {
    const html = renderCalendar();

    expect(html).toContain('class="hidden space-y-1.5 sm:block"');
    expect(html).toContain('class="grid grid-cols-8 gap-1');
    expect(html).toContain(">V</span>");
    for (const weekday of ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"]) {
      expect(html).toContain(weekday);
    }
    expect(html).toContain(">V41</div>");
  });

  it("disables future days in both layouts", () => {
    const html = renderCalendar();

    expect(html.match(/disabled=""/g)).toHaveLength(8);
  });
});
