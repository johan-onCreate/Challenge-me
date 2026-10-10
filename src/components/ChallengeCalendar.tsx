import {
  getChallengeDates,
  getIsoWeekNumber,
  getMondayFirstOffset,
} from "../calendarUtils";

export interface ChallengeCalendarProps {
  startDate: string;
  endDate: string;
  todayDate: string;
  loggedAmounts: ReadonlyMap<string, number>;
  editingDate: string | null;
  editingAmount: string;
  onEditingAmountChange: (amount: string) => void;
  onSelectDate: (date: string, loggedAmount: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

type CalendarCell =
  | { type: "week"; weekNumber: number | null }
  | { type: "day"; date: string | null };

function formatDate(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("sv-SE", options);
}

function buildCalendarCells(dates: string[]): CalendarCell[] {
  const offset = dates.length > 0 ? getMondayFirstOffset(dates[0]) : 0;
  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...dates,
  ];
  const rows: CalendarCell[] = [];

  for (let index = 0; index < cells.length; index += 7) {
    const week = cells.slice(index, index + 7);
    const firstDate = week.find((date): date is string => Boolean(date));
    rows.push({
      type: "week",
      weekNumber: firstDate ? getIsoWeekNumber(firstDate) : null,
    });
    week.forEach((date) => rows.push({ type: "day", date }));
  }

  return rows;
}

export default function ChallengeCalendar({
  startDate,
  endDate,
  todayDate,
  loggedAmounts,
  editingDate,
  editingAmount,
  onEditingAmountChange,
  onSelectDate,
  onSave,
  onCancel,
}: ChallengeCalendarProps) {
  const dates = getChallengeDates(startDate, endDate);
  const cells = buildCalendarCells(dates);
  const monthLabel = `${formatDate(startDate, {
    month: "long",
    year: "numeric",
  })} – ${formatDate(endDate, { month: "long", year: "numeric" })}`;

  return (
    <div className="space-y-3 rounded-xl border border-outline-soft bg-inset p-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Kalender
          <span className="ml-2 font-medium normal-case text-content-faint">
            {monthLabel}
          </span>
        </span>
        <span className="text-[11px] text-content-faint">
          Klicka på en dag för att logga aktivitet
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:hidden">
        {cells.map((cell, index) => {
          if (cell.type === "week") {
            return (
              <div
                key={`mobile-week-${index}`}
                className="border-b border-outline-soft px-1 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-content-faint"
              >
                Vecka {cell.weekNumber}
              </div>
            );
          }

          const date = cell.date;
          if (!date) return null;

          const loggedAmount = loggedAmounts.get(date) || 0;
          const isToday = date === todayDate;
          const isFuture = date > todayDate;
          const dateLabel = formatDate(date, {
            weekday: "short",
            day: "numeric",
            month: "short",
          });

          if (editingDate === date) {
            return (
              <div
                key={date}
                className="rounded-xl border border-accent-soft-border bg-accent-soft p-3"
              >
                <p className="text-base font-bold capitalize text-accent-soft-text">
                  {dateLabel}
                </p>
                <input
                  type="number"
                  min="0"
                  value={editingAmount}
                  onChange={(event) =>
                    onEditingAmountChange(event.target.value)
                  }
                  aria-label={`Reps ${dateLabel}`}
                  className="mt-2 w-full rounded-lg border border-accent-soft-border bg-raised px-3 py-3 text-base text-content"
                  autoFocus
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={onSave}
                    className="min-h-11 flex-1 rounded-lg bg-success-strong px-3 text-sm font-bold text-white"
                  >
                    Spara
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="min-h-11 rounded-lg bg-raised px-3 text-sm font-bold text-content-faint"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            );
          }

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              onClick={() => onSelectDate(date, loggedAmount)}
              className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left ${
                loggedAmount > 0
                  ? "border-success-soft-border bg-success-soft text-success-soft-text"
                  : isToday
                    ? "border-accent-soft-border bg-accent-soft text-accent-soft-text"
                    : isFuture
                      ? "border-outline-soft bg-raised text-content-fainter"
                      : "border-outline bg-raised text-content-muted"
              } disabled:cursor-not-allowed`}
            >
              <span className="text-base font-bold capitalize">
                {dateLabel}
                {isToday && (
                  <span className="mt-0.5 block text-xs font-medium">Idag</span>
                )}
              </span>
              <span className="shrink-0 text-base font-bold">
                {loggedAmount > 0
                  ? `${loggedAmount} reps`
                  : isFuture
                    ? "—"
                    : "+ Logga"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden space-y-1.5 sm:block">
        <div className="grid grid-cols-8 gap-1 text-center text-xs font-bold uppercase tracking-wide text-content-fainter">
          <span>V</span>
          {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {cells.map((cell, index) => {
            if (cell.type === "week") {
              return (
                <div
                  key={`desktop-week-${index}`}
                  className="flex min-h-14 items-center justify-center rounded-lg bg-inset text-[10px] font-bold text-content-faint"
                >
                  {cell.weekNumber ? `V${cell.weekNumber}` : ""}
                </div>
              );
            }

            const date = cell.date;
            if (!date) {
              return <div key={`desktop-empty-${index}`} className="min-h-14" />;
            }

            const loggedAmount = loggedAmounts.get(date) || 0;
            const isToday = date === todayDate;
            const isFuture = date > todayDate;
            const dayNumber = Number(date.slice(8, 10));
            const firstOfMonth = date.slice(8, 10) === "01";
            const dayMonth = firstOfMonth
              ? formatDate(date, { month: "short" })
              : "";

            if (editingDate === date) {
              return (
                <div
                  key={date}
                  className="min-h-14 rounded-lg border border-accent-soft-border bg-accent-soft p-1"
                >
                  {dayMonth && (
                    <span className="block truncate text-[9px] font-bold capitalize text-accent-soft-text">
                      {dayMonth}
                    </span>
                  )}
                  <span className="block text-xs font-bold text-accent-soft-text">
                    {dayNumber}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={editingAmount}
                    onChange={(event) =>
                      onEditingAmountChange(event.target.value)
                    }
                    aria-label={`Reps ${date}`}
                    className="w-full rounded border border-accent-soft-border px-1 py-0.5 text-[10px] text-content"
                    autoFocus
                  />
                  <div className="mt-1 flex gap-1">
                    <button
                      type="button"
                      onClick={onSave}
                      className="flex-1 rounded bg-success-strong px-1 py-0.5 text-[10px] font-bold text-white"
                    >
                      Spara
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="rounded bg-raised px-1 py-0.5 text-[10px] font-bold text-content-faint"
                    >
                      X
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={date}
                type="button"
                disabled={isFuture}
                onClick={() => onSelectDate(date, loggedAmount)}
                className={`min-h-14 rounded-lg border p-1 text-left transition-colors ${
                  loggedAmount > 0
                    ? "border-success-soft-border bg-success-soft text-success-soft-text"
                    : isToday
                      ? "border-accent-soft-border bg-accent-soft text-accent-soft-text"
                      : isFuture
                        ? "border-outline-soft bg-raised text-content-fainter"
                        : "border-outline bg-raised text-content-muted hover:border-accent-soft-border hover:bg-accent-soft"
                } disabled:cursor-not-allowed`}
                title={`${date}${loggedAmount > 0 ? `: ${loggedAmount} reps` : ": lägg till reps"}`}
              >
                {dayMonth && (
                  <span className="block truncate text-[9px] font-bold capitalize text-content-faint">
                    {dayMonth}
                  </span>
                )}
                <span className="block text-xs font-bold">{dayNumber}</span>
                {loggedAmount > 0 && (
                  <span className="block truncate text-[10px] font-semibold">
                    {loggedAmount} reps
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-content-faint">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-success-soft-border" />
          Loggad
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent-soft-border" />
          Idag
        </span>
      </div>
    </div>
  );
}
