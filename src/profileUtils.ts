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

export function canChangeTier(
  selectedTier: string,
  savedTier: string,
  availableTiers: string[],
): boolean {
  return availableTiers.includes(selectedTier) && selectedTier !== savedTier;
}
