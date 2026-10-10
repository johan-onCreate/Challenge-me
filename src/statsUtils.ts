import { getIsoWeekNumber } from "./calendarUtils";
import { calculateEarnedPoints } from "./profileUtils";

export interface ChallengeLog {
  challengeId: number;
  amount: number;
  loggedAt: string;
}

export interface ChallengeSummary {
  challengeId: number;
  title: string;
  points: number;
  chosenTier: string;
  totalAmount: number;
}

export interface DailyPoint {
  date: string;
  amount: number;
  cumulative: number;
}

export interface WeeklyPoint {
  week: string;
  label: string;
  amount: number;
}

export interface ChallengePoint {
  name: string;
  earned: number;
  max: number;
}

export interface StatsData {
  totalReps: number;
  todayReps: number;
  totalPoints: number;
  challengeCount: number;
  loggedDays: number;
  averagePerDay: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: { date: string; amount: number } | null;
  dailySeries: DailyPoint[];
  weeklySeries: WeeklyPoint[];
  challengeSeries: ChallengePoint[];
}

const DAY_MS = 86_400_000;

export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function toDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return toLocalDateKey(date);
}

export function toDateMs(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00Z`).getTime();
}

export function fromDateMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function sumTotalsByDate(logs: ChallengeLog[]): Map<string, number> {
  const totals = new Map<string, number>();
  logs.forEach((log) => {
    const day = toDateKey(log.loggedAt);
    totals.set(day, (totals.get(day) || 0) + log.amount);
  });
  return totals;
}

export function calculateStreaks(
  loggedDates: string[],
  today: string,
): { current: number; longest: number } {
  const dates = new Set(loggedDates);

  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  [...dates].sort().forEach((date) => {
    const ms = toDateMs(date);
    run = previous !== null && ms - previous === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = ms;
  });

  let current = 0;
  let cursor = toDateMs(today);
  const isLogged = (ms: number) => dates.has(fromDateMs(ms));
  if (!isLogged(cursor)) {
    cursor -= DAY_MS;
  }
  while (isLogged(cursor)) {
    current += 1;
    cursor -= DAY_MS;
  }

  return { current, longest };
}

export function buildDailySeries(
  dailyTotals: Map<string, number>,
): DailyPoint[] {
  let cumulative = 0;
  return [...dailyTotals.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, amount]) => {
      cumulative += amount;
      return { date, amount, cumulative };
    });
}

export function getIsoWeekMonday(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export function buildWeeklySeries(
  dailyTotals: Map<string, number>,
): WeeklyPoint[] {
  const totalsByWeek = new Map<string, number>();
  dailyTotals.forEach((amount, date) => {
    const week = getIsoWeekMonday(date);
    totalsByWeek.set(week, (totalsByWeek.get(week) || 0) + amount);
  });

  return [...totalsByWeek.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, amount]) => ({
      week,
      label: `V${getIsoWeekNumber(week)}`,
      amount,
    }));
}

export function calculateStats(
  logs: ChallengeLog[],
  challenges: ChallengeSummary[],
  today: string,
): StatsData {
  const dailyTotals = sumTotalsByDate(logs);
  const totalReps = [...dailyTotals.values()].reduce((sum, n) => sum + n, 0);
  const { current, longest } = calculateStreaks([...dailyTotals.keys()], today);
  const loggedDays = dailyTotals.size;
  const bestDay = [...dailyTotals.entries()].reduce<{
    date: string;
    amount: number;
  } | null>((best, [date, amount]) => {
    if (!best || amount > best.amount) return { date, amount };
    return best;
  }, null);
  const totalPoints = challenges.reduce(
    (sum, challenge) =>
      sum +
      calculateEarnedPoints(
        challenge.totalAmount,
        challenge.chosenTier,
        challenge.points,
      ),
    0,
  );

  return {
    totalReps,
    todayReps: dailyTotals.get(today) ?? 0,
    totalPoints,
    challengeCount: challenges.length,
    loggedDays,
    averagePerDay: loggedDays > 0 ? Math.round(totalReps / loggedDays) : 0,
    currentStreak: current,
    longestStreak: longest,
    bestDay,
    dailySeries: buildDailySeries(dailyTotals),
    weeklySeries: buildWeeklySeries(dailyTotals),
    challengeSeries: challenges.map((challenge) => ({
      name: challenge.title,
      earned: calculateEarnedPoints(
        challenge.totalAmount,
        challenge.chosenTier,
        challenge.points,
      ),
      max: challenge.points,
    })),
  };
}
