import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildChallengeState,
  buildWallBadges,
  type OwnedAchievement,
} from "../achievements";
import AchievementsWall, { WallGrid } from "./AchievementsWall";

describe("AchievementsWall", () => {
  it("shows an empty state without an active challenge", () => {
    const html = renderToString(
      <AchievementsWall userId="u-me" isOwn={true} challenge={null} />,
    );
    expect(html).toContain("Ingen aktiv utmaning just nu.");
  });
});

describe("WallGrid", () => {
  const state = buildChallengeState({
    challengeId: 1,
    startKey: "2026-10-01",
    endKey: "2026-10-31",
    todayKey: "2026-10-15",
    userId: "u-me",
    userDayTotals: new Map<string, number>([
      ["2026-10-01", 10],
      ["2026-10-02", 20],
    ]),
    chosenTier: "1000",
    points: 100,
    tierParticipants: [],
  });
  const owned: OwnedAchievement[] = [
    {
      achievementId: "troll.1",
      unlockedAt: "2026-10-02T10:00:00Z",
      seenAt: null,
    },
  ];

  it("renders all 26 badges grouped under family headers", () => {
    const html = renderToString(
      <WallGrid badges={buildWallBadges(state, owned)} />,
    );
    for (const label of [
      "Streaker",
      "Perfekt runda",
      "Volym",
      "Ascent",
      "Tävlan",
      "Trolling",
      "Special",
    ]) {
      expect(html).toContain(label);
    }
    for (const title of [
      "A Week… What a Week",
      "The Human Metronome",
      "The Dinosaur",
      "Mythic: Who Even Are You",
      "Take the Throne",
      "Lazy Sloth",
      "Imp",
      "Baby XP",
      "Santa",
      "Rep List",
      "Monster Day",
    ]) {
      expect(html).toContain(title);
    }
  });

  it("shows the earned state for owned badges", () => {
    const html = renderToString(
      <WallGrid badges={buildWallBadges(state, owned)} />,
    );
    expect(html).toContain("Lazy Sloth");
    expect(html).toContain("✓");
  });
});
