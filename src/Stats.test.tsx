import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatsDashboard } from "./Stats";
import { calculateStats } from "./statsUtils";

const mockData = calculateStats(
  [
    { challengeId: 1, amount: 30, loggedAt: "2026-01-05" },
    { challengeId: 1, amount: 45, loggedAt: "2026-01-06" },
    { challengeId: 1, amount: 20, loggedAt: "2026-01-07" },
  ],
  [
    {
      challengeId: 1,
      title: "Squat-utmaningen",
      points: 100,
      chosenTier: "200",
      totalAmount: 95,
    },
  ],
  "2026-01-07",
);

describe("StatsDashboard", () => {
  it("renders the summary cards and chart sections", () => {
    const html = renderToString(<StatsDashboard data={mockData} />);

    expect(html).toContain("Min statistik");
    expect(html).toContain("Totala poäng");
    expect(html).toContain("Totala reps");
    expect(html).toContain("Snitt per dag");
    expect(html).toContain("Aktuell serie");
    expect(html).toContain("Längsta serie");
    expect(html).toContain("Reps över tid");
    expect(html).toContain("Reps per vecka");
    expect(html).toContain("Poäng per challenge");
    expect(html).toContain(">95<");
  });

  it("renders an empty state without any activity", () => {
    const html = renderToString(
      <StatsDashboard data={calculateStats([], [], "2026-01-07")} />,
    );

    expect(html).toContain("Ingen aktivitet ännu");
  });
});
