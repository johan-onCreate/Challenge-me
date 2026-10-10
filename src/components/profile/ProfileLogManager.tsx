import type { FormEventHandler } from "react";

export interface ProfileLogEntry {
  id: number;
  amount: number;
  logged_at: string;
}

export function ProfileLogManager({
  logDate,
  minDate,
  maxLogDate,
  logAmount,
  logs,
  editingLogId,
  editingAmount,
  onLogDateChange,
  onLogAmountChange,
  onSubmitLog,
  onEditingAmountChange,
  onUpdateLog,
  onCancelEdit,
  onStartEdit,
  onDeleteLog,
  onStartCancel,
}: {
  logDate: string;
  minDate: string;
  maxLogDate: string;
  logAmount: string;
  logs: ProfileLogEntry[];
  editingLogId: number | null;
  editingAmount: string;
  onLogDateChange: (value: string) => void;
  onLogAmountChange: (value: string) => void;
  onSubmitLog: FormEventHandler<HTMLFormElement>;
  onEditingAmountChange: (value: string) => void;
  onUpdateLog: (logId: number) => void;
  onCancelEdit: () => void;
  onStartEdit: (log: ProfileLogEntry) => void;
  onDeleteLog: (logId: number) => void;
  onStartCancel: () => void;
}) {
  return (
    <>
      <form
        onSubmit={onSubmitLog}
        className="space-y-3 bg-inset p-4 rounded-xl border border-outline-soft"
      >
        <span className="block text-xs font-bold uppercase tracking-wider text-content-muted">
          Logga aktivitet
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="date"
            value={logDate}
            min={minDate}
            max={maxLogDate}
            onChange={(event) => onLogDateChange(event.target.value)}
            required
            className="w-full px-3 py-2 border border-outline rounded-xl text-sm bg-raised"
          />
          <input
            type="number"
            value={logAmount}
            onChange={(event) => onLogAmountChange(event.target.value)}
            placeholder="Antal reps"
            required
            className="w-full px-3 py-2 border border-outline rounded-xl text-sm bg-raised"
          />
          <button
            type="submit"
            className="w-full bg-btn hover:bg-btn-hover text-on-btn font-semibold py-2 rounded-xl text-sm transition-colors"
          >
            Logga reps
          </button>
        </div>
      </form>

      {logs.length > 0 && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-content-faint">
            Dina registrerade loggar
          </label>
          <div className="max-h-40 overflow-y-auto space-y-1.5 border border-outline-soft rounded-xl p-2 bg-inset/50">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex justify-between items-center text-xs text-content-muted bg-raised p-2 rounded-lg border border-outline/40 shadow-sm"
              >
                {editingLogId === log.id ? (
                  <div className="flex gap-2 items-center flex-1">
                    <span className="font-semibold text-content-faint">
                      📅 {log.logged_at}:
                    </span>
                    <input
                      type="number"
                      value={editingAmount}
                      onChange={(event) =>
                        onEditingAmountChange(event.target.value)
                      }
                      className="w-20 px-2 py-1 border border-outline rounded-md text-content"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateLog(log.id)}
                      className="bg-success-strong text-white px-2 py-1 rounded-md font-medium"
                    >
                      Spara
                    </button>
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="text-content-fainter hover:text-content-muted"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <>
                    <span>
                      📅{" "}
                      <strong className="font-medium text-content-secondary">
                        {log.logged_at}
                      </strong>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-content">
                        {log.amount} reps
                      </span>
                      <button
                        type="button"
                        onClick={() => onStartEdit(log)}
                        className="text-accent hover:text-accent-hover font-medium"
                      >
                        Ändra
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLog(log.id)}
                        className="text-danger hover:text-danger-strong font-medium"
                      >
                        Ta bort
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onStartCancel}
        className="w-full border border-danger-soft-border bg-danger-soft text-danger hover:bg-danger-soft-border font-semibold py-2 rounded-xl text-sm transition-colors"
      >
        Avbryt challenge
      </button>
    </>
  );
}
