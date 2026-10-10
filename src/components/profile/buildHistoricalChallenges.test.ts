import { describe, expect, it } from "vitest";
import { buildHistoricalChallenges } from "./buildHistoricalChallenges";

describe("buildHistoricalChallenges", () => {
  it("excludes the active challenge and sorts history by completion date", () => {
    const historical = buildHistoricalChallenges({
      userId: "user-1",
      activeChallengeId: 3,
      userChallenges: [
        {
          challenge_id: 1,
          chosen_tier: "100",
          completed_at: "2026-01-01",
        },
        {
          challenge_id: 2,
          chosen_tier: null,
          completed_at: "2026-02-01",
        },
        {
          challenge_id: 3,
          chosen_tier: "100",
          completed_at: "2026-03-01",
        },
      ],
      challenges: [
        { id: 1, title: "Äldre", description: "", points: 100 },
        { id: 2, title: "Nyare", description: "", points: 80 },
        { id: 3, title: "Aktiv", description: "", points: 100 },
      ],
      userLogs: [
        { challenge_id: 1, amount: 50 },
        { challenge_id: 2, amount: 20 },
      ],
      participants: [
        { user_id: "user-1", challenge_id: 1, chosen_tier: "100" },
        { user_id: "user-2", challenge_id: 1, chosen_tier: "100" },
      ],
      challengeLogs: [
        { user_id: "user-1", challenge_id: 1, amount: 50 },
        { user_id: "user-2", challenge_id: 1, amount: 75 },
      ],
    });

    expect(historical.map((challenge) => challenge.title)).toEqual([
      "Nyare",
      "Äldre",
    ]);
    expect(historical[1]).toMatchObject({
      earnedPoints: 50,
      placement: 2,
      participantCount: 2,
      chosenTier: "100",
    });
  });
});
