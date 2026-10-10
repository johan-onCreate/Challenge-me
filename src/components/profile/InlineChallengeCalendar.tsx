export function InlineChallengeCalendar({
  calendarCells,
  loggedAmounts,
  todayDate,
  editingDate,
  editingAmount,
  onEditingAmountChange,
  onSave,
  onCancel,
  onSelectDate,
}: {
  calendarCells: Array<string | null>;
  loggedAmounts: Map<string, number>;
  todayDate: string;
  editingDate: string | null;
  editingAmount: string;
  onEditingAmountChange: (amount: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onSelectDate: (date: string, amount: number) => void;
}) {
  return (
    <div className="hidden space-y-3 bg-inset p-4 rounded-xl border border-outline-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Kalender
        </span>
        <span className="text-[11px] text-content-faint">
          Klicka på en dag för att logga aktivitet
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-content-fainter">
        {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-14" />;
          }

          const loggedAmount = loggedAmounts.get(date) || 0;
          const isToday = date === todayDate;
          const isFuture = date > todayDate;
          const dayNumber = Number(date.slice(8, 10));

          if (editingDate === date) {
            return (
              <div
                key={date}
                className="min-h-14 rounded-lg border border-accent-soft-border bg-accent-soft p-1"
              >
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
