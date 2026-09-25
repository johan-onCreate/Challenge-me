export function getTargetAmount(tier: string): number {
  return Number.parseInt(tier, 10) || 0;
}

export function calculateTargetAveragePerDay(
  tier: string,
  challengeDays: number,
): number {
  const targetAmount = getTargetAmount(tier);

  if (targetAmount <= 0 || challengeDays <= 0) {
    return 0;
  }

  return targetAmount / challengeDays;
}

export function calculateTargetProgress(
  tier: string,
  challengeDays: number,
  day: number,
): number {
  return calculateTargetAveragePerDay(tier, challengeDays) * day;
}
