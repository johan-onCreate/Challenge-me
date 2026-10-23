import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ChallengeCalendar, {
  ChallengeCalendarProps,
} from "./ChallengeCalendar";

const renderCalendar = (overrides: Partial<ChallengeCalendarProps> = {}) =>
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
      {...overrides}
    />,
  );

const countDisabled = (html: string) =>
  html.match(/disabled=""/g)?.length ?? 0;

describe("ChallengeCalendar responsive layouts", () => {
  it("renders a spacious mobile list grouped by ISO week", () => {
    const html = renderCalendar();

    expect(html).toContain(
      'class="relative grid max-h-[420px] grid-cols-1 gap-2 overflow-y-auto sm:hidden"',
    );
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

    expect(countDisabled(html)).toBe(8);
  });
});

describe("ChallengeCalendar edge cases", () => {
  it("treats every day as future when today is before the challenge starts", () => {
    const html = renderCalendar({ todayDate: "2026-10-01" });

    // "Idag" only appears in the legend, not as a day badge
    expect(html.match(/Idag/g)).toHaveLength(1);
    expect(html).not.toContain("+ Logga");
    expect(countDisabled(html)).toBe(14);
  });

  it("treats every day as past when today is after the challenge ends", () => {
    const html = renderCalendar({
      todayDate: "2026-10-20",
      loggedAmounts: new Map(),
    });

    expect(html.match(/Idag/g)).toHaveLength(1);
    expect(countDisabled(html)).toBe(0);
    expect(html.match(/\+ Logga/g)).toHaveLength(7);
  });

  it("renders a header for each ISO week in multi-week challenges", () => {
    const html = renderCalendar({ endDate: "2026-10-18" });

    expect(html).toContain("Vecka <!-- -->41");
    expect(html).toContain("Vecka <!-- -->42");
    expect(html).toContain(">V41</div>");
    expect(html).toContain(">V42</div>");
    expect(countDisabled(html)).toBe(22);
  });

  it("renders a single-day challenge with today enabled", () => {
    const html = renderCalendar({
      startDate: "2026-10-07",
      endDate: "2026-10-07",
    });

    expect(html.match(/Idag/g)).toHaveLength(2);
    expect(countDisabled(html)).toBe(0);
  });

  it("opens the edit panel for the selected date in both layouts", () => {
    const html = renderCalendar({
      editingDate: "2026-10-06",
      editingAmount: "12",
    });

    expect(html).toContain('value="12"');
    expect(html).toContain("Spara");
    expect(html).toContain("Avbryt");
  });

  it("shows no logged amounts when there are no logs", () => {
    const html = renderCalendar({ loggedAmounts: new Map() });

    expect(html).not.toContain("<!-- --> reps");
    // Oct 5, Oct 6 and today (Oct 7) are all loggable
    expect(html.match(/\+ Logga/g)).toHaveLength(3);
  });

  it("renders leading empty cells when the challenge starts mid-week", () => {
    const html = renderCalendar({ startDate: "2026-10-07" });

    expect(html).toContain("Vecka <!-- -->41");
    expect(html.match(/class="flex min-h-16/g)).toHaveLength(5);
    expect(html.match(/class="min-h-14"/g)).toHaveLength(2);
  });

  it("labels weeks and months across a year boundary", () => {
    const html = renderCalendar({
      startDate: "2026-12-28",
      endDate: "2027-01-03",
      todayDate: "2026-12-28",
    });

    expect(html).toContain("Vecka <!-- -->53");
    expect(html).toContain("januari 2027");
    expect(html.match(/Idag/g)).toHaveLength(2);
    // Dec 29–31 and Jan 1–3 are future, in both layouts
    expect(countDisabled(html)).toBe(12);
  });
});
