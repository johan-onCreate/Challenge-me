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

export function canChangeTier(
  selectedTier: string,
  savedTier: string,
  availableTiers: string[],
): boolean {
  return availableTiers.includes(selectedTier) && selectedTier !== savedTier;
}
