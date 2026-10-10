export function calculateProgressPercent(
  totalLoggedAmount: number,
  savedTier: string,
): number {
  const targetNumber = Number.parseInt(savedTier, 10) || 0;

  if (targetNumber <= 0) {
    return 0;
  }

  return Math.min(Math.round((totalLoggedAmount / targetNumber) * 100), 100);
}

export function calculateEarnedPoints(
  totalLoggedAmount: number,
  savedTier: string,
  maximumPoints: number,
): number {
  const targetNumber = Number.parseInt(savedTier, 10) || 0;

  if (targetNumber <= 0 || maximumPoints <= 0) {
    return 0;
  }

  const completionRatio = Math.min(
    Math.max(totalLoggedAmount / targetNumber, 0),
    1,
  );

  return Math.round(maximumPoints * completionRatio);
}

export interface ChallengePointsInput {
  totalLoggedAmount: number;
  savedTier: string;
  maximumPoints: number;
}

export function calculateProfilePoints(
  historicalChallenges: readonly ChallengePointsInput[],
  currentChallenge: ChallengePointsInput | null,
): { currentChallengePoints: number; totalPoints: number } {
  const historicalPoints = historicalChallenges.reduce(
    (total, challenge) =>
      total +
      calculateEarnedPoints(
        challenge.totalLoggedAmount,
        challenge.savedTier,
        challenge.maximumPoints,
      ),
    0,
  );
  const currentChallengePoints = currentChallenge
    ? calculateEarnedPoints(
        currentChallenge.totalLoggedAmount,
        currentChallenge.savedTier,
        currentChallenge.maximumPoints,
      )
    : 0;

  return {
    currentChallengePoints,
    totalPoints: historicalPoints + currentChallengePoints,
  };
}

export function canChangeTier(
  selectedTier: string,
  savedTier: string,
  availableTiers: string[],
): boolean {
  return availableTiers.includes(selectedTier) && selectedTier !== savedTier;
}
