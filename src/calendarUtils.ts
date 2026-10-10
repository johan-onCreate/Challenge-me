export function getChallengeDates(
  startDate: string,
  endDate: string,
): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const lastDate = new Date(`${endDate}T00:00:00`);

  while (cursor <= lastDate) {
    dates.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function getIsoWeekNumber(dateKey: string): number {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getMondayFirstOffset(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return (day + 6) % 7;
}

export function isAllowedLogDate(
  dateKey: string,
  startKey: string,
  endKey: string,
  todayKey: string,
): boolean {
  return (
    dateKey >= startKey &&
    dateKey <= endKey &&
    dateKey <= todayKey
  );
}
