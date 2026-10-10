export function CancelChallengeDialog({
  phrase,
  message,
  loading,
  onPhraseChange,
  onDismiss,
  onConfirm,
}: {
  phrase: string;
  message: string;
  loading: boolean;
  onPhraseChange: (value: string) => void;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-raised p-6 shadow-xl space-y-5">
        <div>
          <h3 className="text-lg font-bold text-content">Avbryt challenge?</h3>
          <p className="mt-2 text-sm text-content-muted">
            Ditt deltagande och alla loggade reps för challengen tas bort. Detta
            går inte att ångra.
          </p>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-content-muted mb-1.5">
            Skriv &quot;Jag skäms&quot; för att bekräfta
          </label>
          <input
            type="text"
            value={phrase}
            onChange={(event) => onPhraseChange(event.target.value)}
            autoFocus
            className="w-full px-3 py-2 border border-outline rounded-xl text-sm outline-none focus:border-danger focus:ring-2 focus:ring-danger-soft-border"
          />
        </div>
        {message && <p className="text-xs font-medium text-danger">{message}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-xl border border-outline py-2 text-sm font-semibold text-content-muted hover:bg-inset"
          >
            Behåll challenge
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              loading ||
              phrase.trim().toLocaleLowerCase("sv-SE") !== "jag skäms"
            }
            className="flex-1 rounded-xl bg-danger py-2 text-sm font-semibold text-white hover:bg-danger-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Avbryter..." : "Avbryt challenge"}
          </button>
        </div>
      </div>
    </div>
  );
}
